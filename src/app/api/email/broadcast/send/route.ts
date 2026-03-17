import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { applyEmailTokens, buildBroadcastHtml, sendMarketingEmail } from '@/lib/email-marketing';
import { isInternalAdminEmail } from '@/lib/admin';

const sendSchema = z.object({
  broadcastId: z.string().uuid().optional(),
  subject: z.string().min(3).max(180).optional(),
  preview_text: z.string().max(300).optional(),
  body_html: z.string().min(1).optional(),
  segment: z.object({
    type: z.enum(['all', 'tag', 'product', 'course_students', 'buyers', 'platform_users', 'platform_pro', 'platform_free']),
    value: z.string().optional(),
  }).optional(),
  sendNow: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
  testEmail: z.string().email().optional(),
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveRecipients(supabase: Awaited<ReturnType<typeof createServiceClient>>, creatorId: string, segment: { type: string; value?: string }) {
  if (segment.type === 'all') {
    const { data } = await (supabase.from('email_subscribers') as any)
      .select('id,email,first_name')
      .eq('creator_id', creatorId)
      .eq('is_active', true);
    return data || [];
  }

  if (segment.type === 'tag' && segment.value) {
    const { data } = await (supabase.from('email_subscribers') as any)
      .select('id,email,first_name,tags')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .contains('tags', [segment.value]);
    return data || [];
  }

  if (segment.type === 'buyers' && segment.value) {
    const { data: buyerRows } = await (supabase.from('orders') as any)
      .select('buyer_email')
      .eq('creator_id', creatorId)
      .eq('product_id', segment.value)
      .eq('status', 'completed');

    const emails = Array.from(new Set((buyerRows || []).map((row: { buyer_email: string }) => row.buyer_email.toLowerCase())));
    const { data } = await (supabase.from('email_subscribers') as any)
      .select('id,email,first_name')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .in('email', emails);
    return data || [];
  }

  if (segment.type === 'course_students' && segment.value) {
    const { data: rows } = await (supabase.from('enrollments') as any)
      .select('student_email')
      .eq('creator_id', creatorId)
      .eq('course_id', segment.value);

    const emails = Array.from(new Set((rows || []).map((row: { student_email: string }) => row.student_email.toLowerCase())));
    const { data } = await (supabase.from('email_subscribers') as any)
      .select('id,email,first_name')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .in('email', emails);
    return data || [];
  }

  return [];
}

async function resolvePlatformRecipients(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  segmentType: 'platform_users' | 'platform_pro' | 'platform_free'
) {
  const { data: authUsers } = await ((supabase as any).schema('auth').from('users') as any)
    .select('id,email')
    .not('email', 'is', null);

  const authRows = Array.isArray(authUsers) ? authUsers : [];
  let allowedUserIds: Set<string> | null = null;

  if (segmentType === 'platform_pro' || segmentType === 'platform_free') {
    let tierQuery = (supabase.from('profiles') as any)
      .select('id,subscription_tier');

    if (segmentType === 'platform_pro') {
      tierQuery = tierQuery.eq('subscription_tier', 'pro');
    } else {
      tierQuery = tierQuery.or('subscription_tier.is.null,subscription_tier.eq.free');
    }

    const { data: tierRows } = await tierQuery;
    const ids = Array.isArray(tierRows) ? tierRows.map((row: { id: string }) => row.id) : [];
    allowedUserIds = new Set(ids);
  }

  const deduped = new Map<string, { id: string; email: string; first_name?: string }>();
  for (const row of authRows) {
    if (allowedUserIds && !allowedUserIds.has(String(row.id))) {
      continue;
    }

    const email = String(row.email || '').trim().toLowerCase();
    if (!email) {
      continue;
    }

    const localPart = email.split('@')[0] || '';
    const inferredName = localPart
      .replace(/[._-]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');

    deduped.set(email, {
      id: String(row.id),
      email,
      first_name: inferredName || undefined,
    });
  }

  return Array.from(deduped.values());
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = sendSchema.parse(await request.json());
    const isAdminSender = isInternalAdminEmail(user.email);

    let broadcast: {
      id: string;
      subject: string;
      preview_text: string | null;
      body_html: string;
      segment: { type: string; value?: string };
    } | null = null;

    if (body.broadcastId) {
      const { data } = await (serviceSupabase.from('email_broadcasts') as any)
        .select('*')
        .eq('id', body.broadcastId)
        .eq('creator_id', user.id)
        .single();
      broadcast = data || null;
    } else if (body.subject && body.body_html && body.segment) {
      const { data } = await (serviceSupabase.from('email_broadcasts') as any)
        .insert({
          creator_id: user.id,
          subject: body.subject,
          preview_text: body.preview_text || null,
          body_html: body.body_html,
          segment: body.segment,
          status: body.sendNow ? 'sending' : 'scheduled',
          scheduled_at: body.sendNow ? null : (body.scheduledAt || null),
        })
        .select('*')
        .single();
      broadcast = data || null;
    }

    if (!broadcast) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    if (!body.sendNow) {
      await (serviceSupabase.from('email_broadcasts') as any)
        .update({ status: 'scheduled', scheduled_at: body.scheduledAt || null })
        .eq('id', broadcast.id);
      return NextResponse.json({ success: true, scheduled: true });
    }

    const { data: creatorProfile } = await (serviceSupabase.from('profiles') as any)
      .select('full_name,subscription_tier')
      .eq('id', user.id)
      .maybeSingle();

    const segmentType = (broadcast.segment?.type || 'all') as string;

    let recipients: { id: string | null; email: string; first_name?: string }[] = [];

    if (body.testEmail) {
      recipients = [{ id: null, email: body.testEmail, first_name: 'Test' }];
    } else if (segmentType === 'platform_users' || segmentType === 'platform_pro' || segmentType === 'platform_free') {
      if (!isAdminSender) {
        return NextResponse.json({ error: 'Only internal admins can send platform-wide broadcasts.' }, { status: 403 });
      }

      recipients = await resolvePlatformRecipients(serviceSupabase as any, segmentType);
    } else {
      recipients = await resolveRecipients(serviceSupabase as any, user.id, broadcast.segment || { type: 'all' });
    }

    const isProUser = (creatorProfile?.subscription_tier || 'free') === 'pro' || isInternalAdminEmail(user.email);
    const isTestEmail = Boolean(body.testEmail);
    const FREE_MONTHLY_EMAIL_RECIPIENT_LIMIT = 20;

    if (!isProUser && !isTestEmail) {
      const now = new Date();
      const startOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const startOfNextMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

      const { data: monthlyBroadcasts, error: monthlyUsageError } = await (serviceSupabase.from('email_broadcasts') as any)
        .select('recipient_count')
        .eq('creator_id', user.id)
        .eq('status', 'sent')
        .gte('sent_at', startOfMonthUtc.toISOString())
        .lt('sent_at', startOfNextMonthUtc.toISOString());

      if (monthlyUsageError) {
        console.error('Monthly email usage lookup error:', monthlyUsageError);
        return NextResponse.json({ error: 'Failed to validate email quota' }, { status: 500 });
      }

      const recipientsUsedThisMonth = (monthlyBroadcasts || []).reduce(
        (total: number, row: { recipient_count: number | null }) => total + (row.recipient_count || 0),
        0
      );

      const wouldExceedLimit = recipientsUsedThisMonth + recipients.length > FREE_MONTHLY_EMAIL_RECIPIENT_LIMIT;
      if (wouldExceedLimit) {
        return NextResponse.json(
          { error: 'You have used up your free email campaigns for this month. Upgrade to Pro to keep sending.' },
          { status: 403 }
        );
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';

    await (serviceSupabase.from('email_broadcasts') as any)
      .update({ status: 'sending', recipient_count: recipients.length })
      .eq('id', broadcast.id);

    const batchSize = 100;
    for (let index = 0; index < recipients.length; index += batchSize) {
      const batch = recipients.slice(index, index + batchSize);

      await Promise.all(batch.map(async (recipient: { id: string | null; email: string; first_name?: string | null }) => {
        const sendRow = body.testEmail
          ? { id: `test-${Date.now()}-${index}` }
          : await (serviceSupabase.from('email_sends') as any)
            .insert({ broadcast_id: broadcast?.id, subscriber_id: recipient.id })
            .select('id')
            .single()
            .then((res: { data: { id: string } | null }) => res.data || { id: '' });

        const sendId = sendRow.id;
        const htmlWithTokens = applyEmailTokens(broadcast?.body_html || '', {
          firstName: recipient.first_name,
          creatorName: creatorProfile?.full_name || 'Creator',
        });

        const openTrackingUrl = `${appUrl}/api/email/track/open/${sendId}`;
        const clickTrackingPrefix = `${appUrl}/api/email/track/click/${sendId}`;

        const html = buildBroadcastHtml({
          bodyHtml: htmlWithTokens,
          previewText: broadcast?.preview_text || '',
          subject: broadcast?.subject || 'New update for you',
          openTrackingUrl,
          clickTrackingPrefix,
        });

        await sendMarketingEmail({
          to: recipient.email,
          subject: body.testEmail ? `[Test] ${broadcast?.subject}` : (broadcast?.subject || 'Update'),
          html,
        });
      }));

      if (index + batchSize < recipients.length) {
        await sleep(1000);
      }
    }

    await (serviceSupabase.from('email_broadcasts') as any)
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', broadcast.id);

    return NextResponse.json({ success: true, sent: recipients.length });
  } catch (error) {
    console.error('Broadcast send error:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { sendMarketingEmail } from '@/lib/email-marketing';

const subscribeSchema = z.object({
  creatorId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  source: z.string().max(120).optional(),
  tag: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const body = subscribeSchema.parse(await request.json());
    const supabase = await createServiceClient();

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('id, subscription_tier, full_name, email_form_title, lead_magnet_product_id')
      .eq('id', body.creatorId)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const { count: activeCount } = await (supabase.from('email_subscribers') as any)
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', body.creatorId)
      .eq('is_active', true);

    if ((profile.subscription_tier || 'free') === 'free' && (activeCount || 0) >= 500) {
      return NextResponse.json({
        error: 'Subscriber limit reached for free plan',
        code: 'SUBSCRIBER_LIMIT_REACHED',
      }, { status: 403 });
    }

    const tags = body.tag ? [body.tag] : [];

    const { data: subscriber, error: upsertError } = await (supabase.from('email_subscribers') as any)
      .upsert({
        creator_id: body.creatorId,
        email: body.email.toLowerCase(),
        first_name: body.firstName || null,
        name: body.firstName || null,
        source: body.source || 'storefront',
        tags,
        is_active: true,
      }, { onConflict: 'creator_id,email' })
      .select('id,email,first_name')
      .single();

    if (upsertError) {
      console.error('Subscribe upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    await (supabase.from('analytics_events') as any).insert({
      creator_id: body.creatorId,
      event_type: 'email_signup',
      metadata: {
        source: body.source || 'storefront',
      },
    });

    await (supabase.from('notifications') as any).insert({
      user_id: body.creatorId,
      type: 'new_subscriber',
      title: 'New subscriber',
      message: `${body.email} joined your email list`,
      metadata: { source: body.source || 'storefront' },
    });

    const { data: activeSequences } = await (supabase.from('email_sequences') as any)
      .select('id')
      .eq('creator_id', body.creatorId)
      .eq('trigger', 'new_subscriber')
      .eq('is_active', true);

    for (const sequence of activeSequences || []) {
      await (supabase.from('email_sequence_enrollments') as any).upsert({
        sequence_id: sequence.id,
        subscriber_id: subscriber.id,
        current_step: 0,
        next_send_at: new Date().toISOString(),
        completed: false,
      }, { onConflict: 'sequence_id,subscriber_id' });
    }

    if (profile.lead_magnet_product_id) {
      const { data: leadMagnet } = await (supabase.from('products') as any)
        .select('id,title,file_url')
        .eq('id', profile.lead_magnet_product_id)
        .maybeSingle();

      if (leadMagnet?.id) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';
        const accessUrl = `${appUrl}/checkout/${leadMagnet.id}`;

        await sendMarketingEmail({
          to: body.email,
          subject: `Your free resource: ${leadMagnet.title}`,
          html: `
            <h2 style="margin-bottom:12px;">Thanks for joining${body.firstName ? `, ${body.firstName}` : ''}!</h2>
            <p>Here is your free resource from ${profile.full_name || 'your creator'}:</p>
            <p><strong>${leadMagnet.title}</strong></p>
            <p><a href="${accessUrl}" style="display:inline-block;background:#0D1B2A;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Get my free download</a></p>
          `,
        });

        // Enroll in any product_purchase sequences mapped to this lead magnet
        const { data: productSequences } = await (supabase.from('email_sequences') as any)
          .select('id')
          .eq('creator_id', body.creatorId)
          .eq('trigger', 'product_purchase')
          .eq('trigger_product_id', leadMagnet.id)
          .eq('is_active', true);

        for (const seq of productSequences || []) {
          await (supabase.from('email_sequence_enrollments') as any).upsert({
            sequence_id: seq.id,
            subscriber_id: subscriber.id,
            current_step: 0,
            next_send_at: new Date().toISOString(),
            completed: false,
          }, { onConflict: 'sequence_id,subscriber_id' });
        }
      }
    }

    return NextResponse.json({ success: true, subscriberId: subscriber.id });
  } catch (error) {
    console.error('Email subscribe error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

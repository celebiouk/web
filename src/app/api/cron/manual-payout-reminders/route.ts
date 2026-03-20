import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { enqueueManualPayoutItems, getDueManualPayouts } from '@/lib/manual-payouts';
import { getInternalAdminEmails } from '@/lib/admin';
import { sendMarketingEmail } from '@/lib/email-marketing';

function dayDiff(dateOnly: string, now: Date) {
  const target = new Date(`${dateOnly}T00:00:00.000Z`);
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();
    const db = supabase as any;

    const queued = await enqueueManualPayoutItems({ supabase });
    const duePayouts = await getDueManualPayouts({ supabase, daysAhead: 2 });
    const admins = getInternalAdminEmails();

    let emailsSent = 0;

    for (const payout of duePayouts) {
      const daysUntil = dayDiff(payout.payout_date, new Date());
      const reminderField = daysUntil === 2
        ? 'reminder_2d_sent_at'
        : daysUntil === 1
          ? 'reminder_1d_sent_at'
          : 'reminder_0d_sent_at';

      if (daysUntil < 0 || daysUntil > 2) continue;
      if ((payout as any)[reminderField]) continue;

      const creatorName = payout.profiles?.full_name || payout.profiles?.username || payout.creator_id;
      const amount = (Number(payout.amount_cents || 0) / 100).toFixed(2);
      const urgency = daysUntil === 0
        ? 'DUE TODAY'
        : daysUntil === 1
          ? 'DUE TOMORROW'
          : 'DUE IN 2 DAYS';

      for (const adminEmail of admins) {
        await sendMarketingEmail({
          to: adminEmail,
          subject: `[Manual Payout ${urgency}] ${creatorName} • $${amount}`,
          html: `
            <h2>Manual payout reminder (${urgency})</h2>
            <p><strong>Creator:</strong> ${creatorName}</p>
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Payout date:</strong> ${payout.payout_date}</p>
            <p>Please process this payout in admin to avoid delayed creator payments.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio'}/admin/payouts">Open Admin Payouts</a></p>
          `,
        });
        emailsSent += 1;
      }

      await db.from('manual_payouts')
        .update({ [reminderField]: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', payout.id);
    }

    return NextResponse.json({
      success: true,
      queuedOrders: queued.queuedOrders,
      payoutsTouched: queued.payoutsTouched,
      duePayouts: duePayouts.length,
      emailsSent,
    });
  } catch (error) {
    console.error('Manual payout reminder cron error:', error);
    return NextResponse.json({ error: 'Failed to process manual payout reminders' }, { status: 500 });
  }
}

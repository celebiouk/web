import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';
import { getDueManualPayouts } from '@/lib/manual-payouts';

function daysUntil(dateOnly: string) {
  const target = new Date(`${dateOnly}T00:00:00.000Z`);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isInternalAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await createServiceClient();
    const due = await getDueManualPayouts({ supabase: service, daysAhead: 2 });
    const totalAmountCents = due.reduce((sum, payout) => sum + Number(payout.amount_cents || 0), 0);

    return NextResponse.json({
      count: due.length,
      totalAmountCents,
      payouts: due.map((payout) => ({
        id: payout.id,
        creatorName: payout.profiles?.full_name || payout.profiles?.username || payout.creator_id,
        amountCents: payout.amount_cents,
        payoutDate: payout.payout_date,
        daysUntil: daysUntil(payout.payout_date),
      })),
    });
  } catch (error) {
    console.error('Manual payout due summary error:', error);
    return NextResponse.json({ error: 'Failed to load due manual payouts' }, { status: 500 });
  }
}

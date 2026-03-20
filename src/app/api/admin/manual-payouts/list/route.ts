import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';
import { enqueueManualPayoutItems } from '@/lib/manual-payouts';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isInternalAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await createServiceClient();
    await enqueueManualPayoutItems({ supabase: service });
    const db = service as any;

    const { data } = await db.from('manual_payouts')
      .select('id,creator_id,payout_date,period_start,period_end,amount_cents,currency,status,created_at,paid_at,paid_by_admin_email, profiles!manual_payouts_creator_id_fkey(full_name,username)')
      .order('payout_date', { ascending: true })
      .limit(300);

    return NextResponse.json({ payouts: data || [] });
  } catch (error) {
    console.error('Manual payout list error:', error);
    return NextResponse.json({ error: 'Failed to load manual payouts' }, { status: 500 });
  }
}

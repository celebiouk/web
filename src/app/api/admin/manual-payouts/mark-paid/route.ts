import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isInternalAdminEmail } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isInternalAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payoutId = String(body.payoutId || '').trim();
    if (!payoutId) {
      return NextResponse.json({ error: 'Missing payoutId' }, { status: 400 });
    }

    const service = await createServiceClient();
    const db = service as any;
    const { data: updated, error } = await db.from('manual_payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by_admin_email: user.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to mark payout as paid' }, { status: 500 });
    }

    if (!updated?.id) {
      return NextResponse.json({ error: 'Payout is not pending or no longer exists' }, { status: 400 });
    }

    await db.from('admin_audit_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action: 'manual_payout_mark_paid',
      details: { payoutId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Manual payout mark-paid error:', error);
    return NextResponse.json({ error: 'Failed to mark payout as paid' }, { status: 500 });
  }
}

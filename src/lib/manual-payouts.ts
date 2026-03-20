import { nextManualPayoutDate } from '@/lib/payout-routing';

type SupabaseLike = any;

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getPayoutPeriodBounds(payoutDate: Date) {
  const year = payoutDate.getFullYear();
  const month = payoutDate.getMonth();
  const day = payoutDate.getDate();

  if (day === 9) {
    const previousMonth = new Date(year, month - 1, 1);
    return {
      periodStart: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 24),
      periodEnd: new Date(year, month, 8),
    };
  }

  return {
    periodStart: new Date(year, month, 9),
    periodEnd: new Date(year, month, 23),
  };
}

export async function enqueueManualPayoutItems(params: {
  supabase: SupabaseLike;
  asOf?: Date;
}) {
  const { supabase } = params;
  const asOf = params.asOf || new Date();

  const { data: creators } = await (supabase.from('profiles') as any)
    .select('id,payout_provider,manual_bank_account_number')
    .eq('payout_provider', 'manual_bank')
    .not('manual_bank_account_number', 'is', null);

  const creatorIds = (creators || []).map((c: { id: string }) => c.id);
  if (!creatorIds.length) {
    return { queuedOrders: 0, payoutsTouched: 0 };
  }

  const { data: completedOrders } = await (supabase.from('orders') as any)
    .select('id,creator_id,amount_cents,platform_fee_cents,created_at,status')
    .in('creator_id', creatorIds)
    .eq('status', 'completed')
    .lte('created_at', asOf.toISOString())
    .order('created_at', { ascending: true })
    .limit(5000);

  const orders = (completedOrders || []) as Array<{
    id: string;
    creator_id: string;
    amount_cents: number;
    platform_fee_cents: number;
    created_at: string;
  }>;

  if (!orders.length) {
    return { queuedOrders: 0, payoutsTouched: 0 };
  }

  const orderIds = orders.map((order) => order.id);
  const { data: existingItems } = await (supabase.from('manual_payout_items') as any)
    .select('order_id')
    .in('order_id', orderIds);

  const assignedOrderIds = new Set((existingItems || []).map((item: { order_id: string }) => item.order_id));
  const pendingOrders = orders.filter((order) => !assignedOrderIds.has(order.id));

  let queuedOrders = 0;
  const touchedPayoutIds = new Set<string>();

  for (const order of pendingOrders) {
    const netAmountCents = Math.max(0, Number(order.amount_cents || 0) - Number(order.platform_fee_cents || 0));
    if (netAmountCents <= 0) {
      continue;
    }

    const payoutDate = nextManualPayoutDate(new Date(order.created_at));
    const { periodStart, periodEnd } = getPayoutPeriodBounds(payoutDate);

    const payoutDateStr = toDateOnly(payoutDate);
    const periodStartStr = toDateOnly(periodStart);
    const periodEndStr = toDateOnly(periodEnd);

    let payoutId: string | null = null;

    const { data: existingPayout } = await (supabase.from('manual_payouts') as any)
      .select('id,amount_cents')
      .eq('creator_id', order.creator_id)
      .eq('payout_date', payoutDateStr)
      .eq('period_start', periodStartStr)
      .eq('period_end', periodEndStr)
      .maybeSingle();

    if (existingPayout?.id) {
      payoutId = existingPayout.id;
      await (supabase.from('manual_payouts') as any)
        .update({
          amount_cents: Number(existingPayout.amount_cents || 0) + netAmountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payoutId);
    } else {
      const { data: createdPayout } = await (supabase.from('manual_payouts') as any)
        .insert({
          creator_id: order.creator_id,
          payout_date: payoutDateStr,
          period_start: periodStartStr,
          period_end: periodEndStr,
          amount_cents: netAmountCents,
          currency: 'usd',
          status: 'pending',
        })
        .select('id')
        .single();

      payoutId = createdPayout?.id || null;
    }

    if (!payoutId) continue;

    const { error: itemInsertError } = await (supabase.from('manual_payout_items') as any)
      .insert({
        payout_id: payoutId,
        creator_id: order.creator_id,
        order_id: order.id,
        amount_cents: netAmountCents,
      });

    if (itemInsertError) {
      continue;
    }

    touchedPayoutIds.add(payoutId);
    queuedOrders += 1;
  }

  return {
    queuedOrders,
    payoutsTouched: touchedPayoutIds.size,
  };
}

export async function getDueManualPayouts(params: {
  supabase: SupabaseLike;
  from?: Date;
  daysAhead?: number;
}) {
  const from = params.from || new Date();
  const daysAhead = typeof params.daysAhead === 'number' ? params.daysAhead : 2;
  const upper = new Date(from);
  upper.setDate(upper.getDate() + daysAhead);

  const { data } = await (params.supabase.from('manual_payouts') as any)
    .select('id,creator_id,payout_date,amount_cents,currency,status,reminder_2d_sent_at,reminder_1d_sent_at,reminder_0d_sent_at, profiles!manual_payouts_creator_id_fkey(full_name,username)')
    .eq('status', 'pending')
    .gte('payout_date', toDateOnly(from))
    .lte('payout_date', toDateOnly(upper))
    .order('payout_date', { ascending: true });

  return (data || []) as Array<{
    id: string;
    creator_id: string;
    payout_date: string;
    amount_cents: number;
    currency: string;
    status: 'pending';
    reminder_2d_sent_at: string | null;
    reminder_1d_sent_at: string | null;
    reminder_0d_sent_at: string | null;
    profiles?: { full_name?: string | null; username?: string | null } | null;
  }>;
}

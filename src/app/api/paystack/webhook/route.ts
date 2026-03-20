import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

function isValidSignature(payload: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!isValidSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(payload) as any;
    if (body?.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const reference = body?.data?.reference;
    if (!reference) {
      return NextResponse.json({ received: true });
    }

    const affiliateCode = body?.data?.metadata?.affiliate_ref;

    const supabase = await createServiceClient();
    await (supabase.from('orders') as any)
      .update({
        status: 'completed',
        delivery_sent_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', reference)
      .eq('status', 'pending');

    if (affiliateCode) {
      const { data: order } = await (supabase.from('orders') as any)
        .select('id,creator_id,amount_cents,status')
        .eq('stripe_payment_intent_id', reference)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle();

      if (order?.id && order.creator_id) {
        const { data: affiliate } = await (supabase.from('affiliates') as any)
          .select('id,commission_rate,status,total_referred_sales_cents,total_commission_earned_cents')
          .eq('creator_id', order.creator_id)
          .eq('affiliate_code', affiliateCode)
          .eq('status', 'approved')
          .maybeSingle();

        if (affiliate?.id) {
          const commissionAmount = Math.round(order.amount_cents * Number(affiliate.commission_rate || 0.2));

          const { data: existing } = await (supabase.from('affiliate_conversions') as any)
            .select('id')
            .eq('order_id', order.id)
            .eq('affiliate_id', affiliate.id)
            .maybeSingle();

          if (!existing?.id) {
            await (supabase.from('affiliate_conversions') as any).insert({
              affiliate_id: affiliate.id,
              order_id: order.id,
              sale_amount_cents: order.amount_cents,
              commission_amount_cents: commissionAmount,
              status: 'pending',
            });

            await (supabase.from('affiliates') as any)
              .update({
                total_referred_sales_cents: (affiliate.total_referred_sales_cents || 0) + order.amount_cents,
                total_commission_earned_cents: (affiliate.total_commission_earned_cents || 0) + commissionAmount,
              })
              .eq('id', affiliate.id);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

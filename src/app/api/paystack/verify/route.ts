import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyPaystackTransaction } from '@/lib/paystack';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference') || '';

  if (!reference) {
    return NextResponse.redirect(new URL('/checkout?paystack=missing_reference', url.origin));
  }

  try {
    const supabase = await createServiceClient();
    const result = await verifyPaystackTransaction(reference);

    if (result.data.status !== 'success') {
      return NextResponse.redirect(new URL(`/checkout?paystack=failed&reference=${encodeURIComponent(reference)}`, url.origin));
    }

    await (supabase.from('orders') as any)
      .update({
        status: 'completed',
        delivery_sent_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', reference)
      .eq('status', 'pending');

    const { data: order } = await (supabase.from('orders') as any)
      .select('id')
      .eq('stripe_payment_intent_id', reference)
      .maybeSingle();

    const target = order?.id
      ? `/checkout/upsell/${order.id}`
      : '/dashboard/orders?paystack=success';

    return NextResponse.redirect(new URL(target, url.origin));
  } catch (error) {
    console.error('Paystack verify callback error:', error);
    return NextResponse.redirect(new URL(`/checkout?paystack=verify_error&reference=${encodeURIComponent(reference)}`, url.origin));
  }
}

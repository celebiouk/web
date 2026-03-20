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

    const supabase = await createServiceClient();
    await (supabase.from('orders') as any)
      .update({
        status: 'completed',
        delivery_sent_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', reference)
      .eq('status', 'pending');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

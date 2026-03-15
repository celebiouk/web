import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { stripe, calculatePlatformFee, createConnectPaymentIntent } from '@/lib/stripe';

const schema = z.object({
  originalOrderId: z.string().uuid(),
  upsellProductId: z.string().uuid(),
  buyerEmail: z.string().email(),
});

function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data: originalOrder } = await (supabase.from('orders') as any)
      .select('id,creator_id,buyer_email,stripe_payment_intent_id')
      .eq('id', body.originalOrderId)
      .single();

    if (!originalOrder || originalOrder.buyer_email.toLowerCase() !== body.buyerEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Original order not found' }, { status: 404 });
    }

    const { data: upsellProduct } = await (supabase.from('products') as any)
      .select('id,title,price,is_published,creator_id')
      .eq('id', body.upsellProductId)
      .eq('creator_id', originalOrder.creator_id)
      .eq('is_published', true)
      .single();

    if (!upsellProduct?.id) {
      return NextResponse.json({ error: 'Upsell product not found' }, { status: 404 });
    }

    const { data: creator } = await (supabase.from('profiles') as any)
      .select('stripe_account_id,subscription_tier')
      .eq('id', originalOrder.creator_id)
      .single();

    if (!creator?.stripe_account_id) {
      return NextResponse.json({ error: 'Creator payments unavailable' }, { status: 400 });
    }

    let charged = false;
    let upsellPaymentIntentId: string | null = null;

    if (originalOrder.stripe_payment_intent_id) {
      const originalPaymentIntent = await stripe.paymentIntents.retrieve(originalOrder.stripe_payment_intent_id);
      const customerId = typeof originalPaymentIntent.customer === 'string' ? originalPaymentIntent.customer : originalPaymentIntent.customer?.id || null;
      const paymentMethodId = typeof originalPaymentIntent.payment_method === 'string'
        ? originalPaymentIntent.payment_method
        : originalPaymentIntent.payment_method?.id || null;

      if (customerId && paymentMethodId) {
        const fee = calculatePlatformFee(upsellProduct.price, creator.subscription_tier || 'free');

        try {
          const oneClickIntent = await stripe.paymentIntents.create({
            amount: upsellProduct.price,
            currency: 'usd',
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            application_fee_amount: fee,
            transfer_data: {
              destination: creator.stripe_account_id,
            },
            metadata: {
              type: 'upsell',
              creator_id: originalOrder.creator_id,
              productId: upsellProduct.id,
              buyerEmail: body.buyerEmail,
              original_order_id: body.originalOrderId,
            },
          });

          upsellPaymentIntentId = oneClickIntent.id;
          charged = true;
        } catch (oneClickError) {
          console.warn('One-click upsell failed, fallback to hosted checkout intent:', oneClickError);
        }
      }
    }

    if (!charged) {
      const fee = calculatePlatformFee(upsellProduct.price, creator.subscription_tier || 'free');
      const intent = await createConnectPaymentIntent({
        amountCents: upsellProduct.price,
        creatorStripeAccountId: creator.stripe_account_id,
        platformFeeCents: fee,
        metadata: {
          type: 'upsell',
          creator_id: originalOrder.creator_id,
          productId: upsellProduct.id,
          buyerEmail: body.buyerEmail,
          original_order_id: body.originalOrderId,
        },
      });
      upsellPaymentIntentId = intent.id;
    }

    const { data: order } = await (supabase.from('orders') as any)
      .insert({
        product_id: upsellProduct.id,
        creator_id: originalOrder.creator_id,
        buyer_email: body.buyerEmail,
        amount_cents: upsellProduct.price,
        platform_fee_cents: calculatePlatformFee(upsellProduct.price, creator.subscription_tier || 'free'),
        stripe_payment_intent_id: upsellPaymentIntentId,
        status: charged ? 'completed' : 'pending',
        delivery_sent_at: charged ? new Date().toISOString() : null,
      })
      .select('id,status')
      .single();

    return NextResponse.json({ success: true, charged, orderId: order?.id || null });
  } catch (error) {
    console.error('Upsell API error:', error);
    return NextResponse.json({ error: 'Failed to process upsell' }, { status: 500 });
  }
}

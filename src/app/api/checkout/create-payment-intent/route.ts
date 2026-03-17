/**
 * Create Payment Intent API
 * POST /api/checkout/create-payment-intent
 * 
 * Creates a Stripe Payment Intent for a product purchase
 * Uses Stripe Connect to route payment to the creator
 */

import { NextResponse } from 'next/server';
import { createConnectPaymentIntent, calculatePlatformFee } from '@/lib/stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization for Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ProductOffer = {
  enabled: boolean;
  discountedPriceCents: number;
  discountCents: number;
  bonusProductId: string | null;
};

function getActiveOffer(product: {
  price: number;
  offer_enabled?: boolean | null;
  offer_discount_price_cents?: number | null;
  offer_limit_type?: 'none' | 'time' | 'claims' | 'both' | null;
  offer_expires_at?: string | null;
  offer_max_claims?: number | null;
  offer_claims_used?: number | null;
  offer_bonus_product_id?: string | null;
}): ProductOffer {
  if (!product.offer_enabled) {
    return { enabled: false, discountedPriceCents: product.price, discountCents: 0, bonusProductId: null };
  }

  const discounted = typeof product.offer_discount_price_cents === 'number'
    ? product.offer_discount_price_cents
    : product.price;

  if (discounted < 0 || discounted >= product.price) {
    return { enabled: false, discountedPriceCents: product.price, discountCents: 0, bonusProductId: null };
  }

  const limitType = product.offer_limit_type || 'none';
  const hasTimeLimit = limitType === 'time' || limitType === 'both';
  const hasClaimsLimit = limitType === 'claims' || limitType === 'both';

  if (hasTimeLimit && product.offer_expires_at) {
    const expiresAtMs = new Date(product.offer_expires_at).getTime();
    if (Number.isFinite(expiresAtMs) && Date.now() >= expiresAtMs) {
      return { enabled: false, discountedPriceCents: product.price, discountCents: 0, bonusProductId: null };
    }
  }

  if (hasClaimsLimit) {
    const maxClaims = Number(product.offer_max_claims || 0);
    const usedClaims = Number(product.offer_claims_used || 0);

    if (!maxClaims || usedClaims >= maxClaims) {
      return { enabled: false, discountedPriceCents: product.price, discountCents: 0, bonusProductId: null };
    }
  }

  return {
    enabled: true,
    discountedPriceCents: discounted,
    discountCents: Math.max(0, product.price - discounted),
    bonusProductId: product.offer_bonus_product_id || null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, buyerEmail } = body;
    const cookieHeader = request.headers.get('cookie') || '';
    const affiliateRef = cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('affiliate_ref='))
      ?.split('=')[1] || '';
    const supabaseAdmin = getSupabaseAdmin();

    if (!productId || !buyerEmail) {
      return NextResponse.json(
        { error: 'Product ID and buyer email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get product with creator info
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_published', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, subscription_tier')
      .eq('id', product.creator_id)
      .single();

    if (creatorError || !creator?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Creator has not set up payments' },
        { status: 400 }
      );
    }

    const activeOffer = getActiveOffer(product as {
      price: number;
      offer_enabled?: boolean | null;
      offer_discount_price_cents?: number | null;
      offer_limit_type?: 'none' | 'time' | 'claims' | 'both' | null;
      offer_expires_at?: string | null;
      offer_max_claims?: number | null;
      offer_claims_used?: number | null;
      offer_bonus_product_id?: string | null;
    });

    const chargeAmountCents = activeOffer.discountedPriceCents;

    let resolvedBonusProductId: string | null = null;
    if (activeOffer.bonusProductId) {
      const { data: bonusProduct } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', activeOffer.bonusProductId)
        .eq('creator_id', product.creator_id)
        .maybeSingle();
      resolvedBonusProductId = bonusProduct?.id || null;
    }

    // Handle free products
    if (chargeAmountCents === 0) {
      // Create order directly for free products
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          product_id: productId,
          creator_id: product.creator_id,
          buyer_email: buyerEmail,
          amount_cents: 0,
          platform_fee_cents: 0,
          offer_applied: activeOffer.enabled,
          offer_discount_cents: activeOffer.discountCents,
          offer_bonus_product_id: resolvedBonusProductId,
          status: 'completed',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return NextResponse.json(
          { error: 'Failed to process order' },
          { status: 500 }
        );
      }

      const offerLimitType = (product.offer_limit_type || 'none') as 'none' | 'time' | 'claims' | 'both';
      if (activeOffer.enabled && (offerLimitType === 'claims' || offerLimitType === 'both')) {
        await supabaseAdmin
          .from('products')
          .update({ offer_claims_used: Number(product.offer_claims_used || 0) + 1 })
          .eq('id', productId)
          .lt('offer_claims_used', Number(product.offer_max_claims || 1000));
      }

      if (order?.id && resolvedBonusProductId) {
        await supabaseAdmin.from('orders').insert({
          product_id: resolvedBonusProductId,
          creator_id: product.creator_id,
          buyer_email: buyerEmail,
          amount_cents: 0,
          platform_fee_cents: 0,
          status: 'completed',
          delivery_sent_at: new Date().toISOString(),
          bonus_from_order_id: order.id,
        });
      }

      return NextResponse.json({
        orderId: order.id,
        free: true,
        amountCents: chargeAmountCents,
        offerApplied: activeOffer.enabled,
      });
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee(chargeAmountCents, creator.subscription_tier);

    const existingCustomers = await stripe.customers.list({
      email: buyerEmail,
      limit: 1,
    });
    const customerId = existingCustomers.data[0]?.id || null;

    const customer = customerId
      ? await stripe.customers.retrieve(customerId)
      : await stripe.customers.create({ email: buyerEmail });

    const resolvedCustomerId = typeof customer === 'string' ? customer : customer.id;

    // Create Payment Intent with Connect
    const paymentIntent = await createConnectPaymentIntent({
      amountCents: chargeAmountCents,
      creatorStripeAccountId: creator.stripe_account_id,
      platformFeeCents: platformFee,
      customerId: resolvedCustomerId,
      metadata: {
        productId,
        creatorId: product.creator_id,
        buyerEmail,
        productTitle: product.title,
        affiliate_ref: affiliateRef,
      },
    });

    // Create pending order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        product_id: productId,
        creator_id: product.creator_id,
        buyer_email: buyerEmail,
        amount_cents: chargeAmountCents,
        platform_fee_cents: platformFee,
        stripe_payment_intent_id: paymentIntent.id,
        offer_applied: activeOffer.enabled,
        offer_discount_cents: activeOffer.discountCents,
        offer_bonus_product_id: resolvedBonusProductId,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      // Cancel the payment intent since we couldn't create the order
      // This is a best-effort cleanup
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order?.id,
      amountCents: chargeAmountCents,
      offerApplied: activeOffer.enabled,
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

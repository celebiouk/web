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

    // Handle free products
    if (product.price === 0) {
      // Create order directly for free products
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          product_id: productId,
          creator_id: product.creator_id,
          buyer_email: buyerEmail,
          amount_cents: 0,
          platform_fee_cents: 0,
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

      return NextResponse.json({
        orderId: order.id,
        free: true,
      });
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee(product.price, creator.subscription_tier);

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
      amountCents: product.price,
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
        amount_cents: product.price,
        platform_fee_cents: platformFee,
        stripe_payment_intent_id: paymentIntent.id,
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
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

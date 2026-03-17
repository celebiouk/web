import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { stripe, createBillingPortalSession } from '@/lib/stripe';
import { APP_URL } from '@/lib/constants';
import { sendPaymentFailedEmail, sendPaymentReceiptEmail, sendProCancelledEmail, sendProWelcomeEmail, sendUpgradeNudgeEmail } from '@/lib/billing-email';
import { ensureUpgradeNudge, markUpgradeNudgeConverted } from '@/lib/nudges';
import type { Database, SubscriptionPlan } from '@/types/supabase';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const supabaseAdmin = getSupabaseAdmin();

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabaseAdmin, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabaseAdmin, event.data.object as Stripe.PaymentIntent);
        break;
      case 'account.updated':
        await handleAccountUpdated(supabaseAdmin, event.data.object as Stripe.Account);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(supabaseAdmin, event.data.object as Stripe.Subscription, event.type);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabaseAdmin, event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabaseAdmin, event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabaseAdmin, event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(supabaseAdmin: SupabaseClient<Database>, paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  if (paymentIntent.metadata?.type === 'bundle' && paymentIntent.metadata?.bundle_id) {
    await handleBundlePurchase(supabaseAdmin, paymentIntent);
  }

  await (supabaseAdmin.from('orders') as any)
    .update({
      status: 'completed',
      delivery_sent_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  const { data: completedOrder } = await (supabaseAdmin.from('orders') as any)
    .select('id, creator_id, product_id, buyer_email, offer_applied, offer_bonus_product_id, products(offer_limit_type, offer_claims_used, offer_max_claims)')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  const orderWithOffer = completedOrder as {
    id: string;
    creator_id: string;
    product_id: string;
    buyer_email: string;
    offer_applied?: boolean;
    offer_bonus_product_id?: string | null;
    products?: { offer_limit_type?: 'none' | 'time' | 'claims'; offer_claims_used?: number; offer_max_claims?: number };
  } | null;

  if (orderWithOffer?.offer_applied && orderWithOffer.products?.offer_limit_type === 'claims') {
    await (supabaseAdmin.from('products') as any)
      .update({ offer_claims_used: Number(orderWithOffer.products.offer_claims_used || 0) + 1 })
      .eq('id', orderWithOffer.product_id)
      .lt('offer_claims_used', Number(orderWithOffer.products.offer_max_claims || 1000));
  }

  if (orderWithOffer?.offer_bonus_product_id && orderWithOffer?.buyer_email) {
    const { data: existingBonus } = await (supabaseAdmin.from('orders') as any)
      .select('id')
      .eq('bonus_from_order_id', orderWithOffer.id)
      .maybeSingle();

    if (!existingBonus?.id) {
      await (supabaseAdmin.from('orders') as any).insert({
        product_id: orderWithOffer.offer_bonus_product_id,
        creator_id: orderWithOffer.creator_id,
        buyer_email: orderWithOffer.buyer_email,
        amount_cents: 0,
        platform_fee_cents: 0,
        status: 'completed',
        delivery_sent_at: new Date().toISOString(),
        bonus_from_order_id: orderWithOffer.id,
      });
    }
  }

  if (completedOrder?.creator_id) {
    await (supabaseAdmin.from('analytics_events') as any).insert({
      creator_id: completedOrder.creator_id,
      event_type: 'purchase',
      product_id: completedOrder.product_id || null,
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
      },
    });
  }

  await (supabaseAdmin.from('bookings') as any)
    .update({ status: 'confirmed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('status', 'pending');

  const { data: bookingForNotification } = await (supabaseAdmin.from('bookings') as any)
    .select('id, creator_id, buyer_name')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('status', 'confirmed')
    .limit(1)
    .maybeSingle();

  if (bookingForNotification?.creator_id) {
    await (supabaseAdmin.from('notifications') as any).insert({
      user_id: bookingForNotification.creator_id,
      type: 'new_booking',
      title: 'New booking confirmed',
      message: `${bookingForNotification.buyer_name} booked a call`,
      metadata: { booking_id: bookingForNotification.id },
    });
  }

  if (paymentIntent.metadata?.type === 'course_enrollment') {
    await handleCourseEnrollment(supabaseAdmin, paymentIntent);
  }

  await handleAffiliateConversion(supabaseAdmin, paymentIntent);

  await recordCommissionLedger(supabaseAdmin, paymentIntent);
}

async function handleAffiliateConversion(supabaseAdmin: SupabaseClient<Database>, paymentIntent: Stripe.PaymentIntent) {
  const affiliateCode = paymentIntent.metadata?.affiliate_ref;
  if (!affiliateCode) {
    return;
  }

  const { data: order } = await (supabaseAdmin.from('orders') as any)
    .select('id,creator_id,amount_cents')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('status', 'completed')
    .limit(1)
    .maybeSingle();

  if (!order?.id || !order.creator_id) {
    return;
  }

  const { data: affiliate } = await (supabaseAdmin.from('affiliates') as any)
    .select('id,commission_rate,status,total_referred_sales_cents,total_commission_earned_cents')
    .eq('creator_id', order.creator_id)
    .eq('affiliate_code', affiliateCode)
    .eq('status', 'approved')
    .maybeSingle();

  if (!affiliate?.id) {
    return;
  }

  const commissionAmount = Math.round(order.amount_cents * Number(affiliate.commission_rate || 0.2));

  const { data: existing } = await (supabaseAdmin.from('affiliate_conversions') as any)
    .select('id')
    .eq('order_id', order.id)
    .eq('affiliate_id', affiliate.id)
    .maybeSingle();

  if (existing?.id) {
    return;
  }

  await (supabaseAdmin.from('affiliate_conversions') as any).insert({
    affiliate_id: affiliate.id,
    order_id: order.id,
    sale_amount_cents: order.amount_cents,
    commission_amount_cents: commissionAmount,
    status: 'pending',
  });

  await (supabaseAdmin.from('affiliates') as any)
    .update({
      total_referred_sales_cents: (affiliate.total_referred_sales_cents || 0) + order.amount_cents,
      total_commission_earned_cents: (affiliate.total_commission_earned_cents || 0) + commissionAmount,
    })
    .eq('id', affiliate.id);
}

async function handleBundlePurchase(supabaseAdmin: SupabaseClient<Database>, paymentIntent: Stripe.PaymentIntent) {
  const bundleId = paymentIntent.metadata?.bundle_id;
  const creatorId = paymentIntent.metadata?.creator_id;
  const buyerEmail = paymentIntent.metadata?.buyer_email;

  if (!bundleId || !creatorId || !buyerEmail) {
    return;
  }

  const { data: existingOrder } = await (supabaseAdmin.from('orders') as any)
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .limit(1)
    .maybeSingle();

  if (existingOrder?.id) {
    return;
  }

  const { data: bundleProducts } = await (supabaseAdmin.from('bundle_products') as any)
    .select('product_id, products(price,title)')
    .eq('bundle_id', bundleId)
    .order('position', { ascending: true });

  if (!bundleProducts?.length) {
    return;
  }

  const totalOriginalValue = bundleProducts.reduce((sum: number, row: { products?: { price?: number } }) => sum + (row.products?.price || 0), 0);
  const bundleAmount = paymentIntent.amount;
  const platformFee = paymentIntent.application_fee_amount || 0;

  for (const row of bundleProducts as Array<{ product_id: string; products?: { price?: number; title?: string } }>) {
    const productPrice = row.products?.price || 0;
    const proportionalShare = totalOriginalValue > 0 ? productPrice / totalOriginalValue : 1 / bundleProducts.length;
    const amountCents = Math.round(bundleAmount * proportionalShare);
    const platformFeeCents = Math.round(platformFee * proportionalShare);

    await (supabaseAdmin.from('orders') as any).insert({
      product_id: row.product_id,
      creator_id: creatorId,
      buyer_email: buyerEmail,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'completed',
      delivery_sent_at: new Date().toISOString(),
    });

    await (supabaseAdmin.from('analytics_events') as any).insert({
      creator_id: creatorId,
      event_type: 'purchase',
      product_id: row.product_id,
      metadata: {
        source: 'bundle',
        bundle_id: bundleId,
      },
    });
  }

  await (supabaseAdmin.from('notifications') as any).insert({
    user_id: creatorId,
    type: 'new_order',
    title: 'New bundle purchase',
    message: `${buyerEmail} purchased one of your bundles`,
    metadata: { bundle_id: bundleId },
  });
}

async function handlePaymentFailed(supabaseAdmin: SupabaseClient<Database>, paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  await (supabaseAdmin.from('orders') as any)
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  await (supabaseAdmin.from('bookings') as any)
    .update({ status: 'pending' })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

async function handleAccountUpdated(supabaseAdmin: SupabaseClient<Database>, account: Stripe.Account) {
  const isComplete = account.charges_enabled && account.payouts_enabled && account.details_submitted;
  const status = isComplete ? 'complete' : 'pending';

  await (supabaseAdmin.from('profiles') as any)
    .update({ stripe_account_status: status })
    .eq('stripe_account_id', account.id);
}

async function handleCourseEnrollment(supabaseAdmin: SupabaseClient<Database>, paymentIntent: Stripe.PaymentIntent) {
  const { course_id, buyer_email, student_user_id, creator_id } = paymentIntent.metadata;

  if (!course_id || !buyer_email) {
    return;
  }

  const { data: existing } = await (supabaseAdmin.from('enrollments') as any)
    .select('id')
    .eq('course_id', course_id)
    .eq('student_email', buyer_email)
    .maybeSingle();

  if (existing) {
    return;
  }

  const platformFeeCents = paymentIntent.application_fee_amount || 0;
  const amountCents = paymentIntent.amount;

  const { data: enrollment, error } = await (supabaseAdmin.from('enrollments') as any)
    .insert({
      course_id,
      creator_id: creator_id || '',
      student_email: buyer_email,
      student_user_id: student_user_id || null,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      net_amount_cents: amountCents - platformFeeCents,
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  const { data: course } = await (supabaseAdmin.from('courses') as any)
    .select('student_count')
    .eq('id', course_id)
    .single();

  if (course) {
    await (supabaseAdmin.from('courses') as any)
      .update({ student_count: (course.student_count || 0) + 1 })
      .eq('id', course_id);
  }

  await (supabaseAdmin.from('notifications') as any).insert({
    user_id: creator_id,
    type: 'new_enrollment',
    title: 'New course enrollment',
    message: `${buyer_email} enrolled in your course`,
    metadata: { course_id },
  });

  return enrollment;
}

async function recordCommissionLedger(supabaseAdmin: SupabaseClient<Database>, paymentIntent: Stripe.PaymentIntent) {
  const commissionAmount = paymentIntent.application_fee_amount || 0;
  if (commissionAmount <= 0) return;

  const { data: existingLedger } = await (supabaseAdmin.from('commission_ledger') as any)
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (existingLedger) return;

  const { data: order } = await (supabaseAdmin.from('orders') as any)
    .select('id, creator_id, amount_cents, platform_fee_cents, status')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (order?.creator_id) {
    await insertCommissionLedgerRow(supabaseAdmin, {
      creatorId: order.creator_id,
      orderId: order.id,
      saleType: 'order',
      saleReferenceId: order.id,
      saleAmountCents: order.amount_cents,
      commissionAmountCents: order.platform_fee_cents,
      stripePaymentIntentId: paymentIntent.id,
      stripeTransferId: normalizeTransferId(paymentIntent.transfer_data),
    });

    await handleUpgradeNudgesForCreator(supabaseAdmin, order.creator_id);
    return;
  }

  const { data: booking } = await (supabaseAdmin.from('bookings') as any)
    .select('id, creator_id, amount_cents, platform_fee_cents')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (booking?.creator_id) {
    await insertCommissionLedgerRow(supabaseAdmin, {
      creatorId: booking.creator_id,
      saleType: 'booking',
      saleReferenceId: booking.id,
      saleAmountCents: booking.amount_cents,
      commissionAmountCents: booking.platform_fee_cents,
      stripePaymentIntentId: paymentIntent.id,
      stripeTransferId: normalizeTransferId(paymentIntent.transfer_data),
    });
    return;
  }

  const { data: enrollment } = await (supabaseAdmin.from('enrollments') as any)
    .select('id, creator_id, amount_cents, platform_fee_cents')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (enrollment?.creator_id) {
    await insertCommissionLedgerRow(supabaseAdmin, {
      creatorId: enrollment.creator_id,
      saleType: 'course_enrollment',
      saleReferenceId: enrollment.id,
      saleAmountCents: enrollment.amount_cents,
      commissionAmountCents: enrollment.platform_fee_cents,
      stripePaymentIntentId: paymentIntent.id,
      stripeTransferId: normalizeTransferId(paymentIntent.transfer_data),
    });
  }
}

async function insertCommissionLedgerRow(
  supabaseAdmin: SupabaseClient<Database>,
  params: {
    creatorId: string;
    saleType: 'order' | 'booking' | 'course_enrollment';
    saleReferenceId: string;
    saleAmountCents: number;
    commissionAmountCents: number;
    stripePaymentIntentId: string;
    stripeTransferId: string | null;
    orderId?: string;
  }
) {
  const commissionRate = params.saleAmountCents > 0
    ? Number((params.commissionAmountCents / params.saleAmountCents).toFixed(4))
    : 0;

  await (supabaseAdmin.from('commission_ledger') as any).insert({
    creator_id: params.creatorId,
    order_id: params.orderId || null,
    sale_type: params.saleType,
    sale_reference_id: params.saleReferenceId,
    stripe_payment_intent_id: params.stripePaymentIntentId,
    sale_amount_cents: params.saleAmountCents,
    commission_rate: commissionRate,
    commission_amount_cents: params.commissionAmountCents,
    stripe_transfer_id: params.stripeTransferId,
  });
}

async function handleUpgradeNudgesForCreator(supabaseAdmin: SupabaseClient<Database>, creatorId: string) {
  const { data: profile } = await (supabaseAdmin.from('profiles') as any)
    .select('subscription_tier, full_name')
    .eq('id', creatorId)
    .maybeSingle();

  if (!profile || profile.subscription_tier !== 'free') return;

  const { data: completedOrders } = await (supabaseAdmin.from('orders') as any)
    .select('amount_cents, platform_fee_cents')
    .eq('creator_id', creatorId)
    .eq('status', 'completed');

  const orderCount = completedOrders?.length || 0;
  const totalRevenue = (completedOrders || []).reduce((sum: number, order: { amount_cents: number }) => sum + order.amount_cents, 0);
  const totalCommission = (completedOrders || []).reduce((sum: number, order: { platform_fee_cents: number }) => sum + order.platform_fee_cents, 0);

  if (orderCount === 1) {
    await ensureUpgradeNudge(supabaseAdmin, creatorId, 'first_sale');
  }

  if (orderCount === 3) {
    await ensureUpgradeNudge(supabaseAdmin, creatorId, 'third_sale');
    const creatorEmail = await getUserEmail(supabaseAdmin, creatorId);
    if (creatorEmail) {
      await sendUpgradeNudgeEmail({
        to: creatorEmail,
        creatorName: profile.full_name || 'Creator',
        saleCount: 3,
        revenue: formatMoney(totalRevenue),
        commission: formatMoney(totalCommission),
      });
    }
  }
}

async function handleSubscriptionUpsert(
  supabaseAdmin: SupabaseClient<Database>,
  subscription: Stripe.Subscription,
  eventType: 'customer.subscription.created' | 'customer.subscription.updated'
) {
  const userId = await resolveUserIdFromSubscription(supabaseAdmin, subscription);
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = resolvePlanFromPriceId(priceId);
  if (!plan) return;

  const currentPeriodStart = getTimestampIso((subscription as unknown as { current_period_start?: number }).current_period_start);
  const currentPeriodEnd = getTimestampIso((subscription as unknown as { current_period_end?: number }).current_period_end);
  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null;

  await (supabaseAdmin.from('subscriptions') as any).upsert({
    user_id: userId,
    plan,
    status: normalizeSubscriptionStatus(subscription.status),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: stripeCustomerId,
    stripe_price_id: priceId,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancelled_at: subscription.cancel_at ? getTimestampIso(subscription.cancel_at) : null,
  }, {
    onConflict: 'user_id',
  });

  await (supabaseAdmin.from('profiles') as any)
    .update({ subscription_tier: 'pro', stripe_customer_id: stripeCustomerId })
    .eq('id', userId);

  await markUpgradeNudgeConverted(supabaseAdmin, userId);

  if (eventType === 'customer.subscription.created') {
    const creatorEmail = await getUserEmail(supabaseAdmin, userId);
    if (creatorEmail) {
      const { data: profile } = await (supabaseAdmin.from('profiles') as any)
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      await sendProWelcomeEmail(creatorEmail, profile?.full_name || 'Creator');
    }
  }
}

async function handleSubscriptionDeleted(supabaseAdmin: SupabaseClient<Database>, subscription: Stripe.Subscription) {
  const userId = await resolveUserIdFromSubscription(supabaseAdmin, subscription);
  if (!userId) return;

  await (supabaseAdmin.from('profiles') as any)
    .update({ subscription_tier: 'free' })
    .eq('id', userId);

  await (supabaseAdmin.from('subscriptions') as any)
    .update({ status: 'canceled', cancelled_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id);

  const creatorEmail = await getUserEmail(supabaseAdmin, userId);
  if (creatorEmail) {
    const { data: profile } = await (supabaseAdmin.from('profiles') as any)
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();
    await sendProCancelledEmail(creatorEmail, profile?.full_name || 'Creator');
  }
}

async function handleInvoicePaymentFailed(supabaseAdmin: SupabaseClient<Database>, invoice: Stripe.Invoice) {
  const customerId = normalizeCustomerId(invoice.customer);
  if (!customerId) return;

  const { data: profile } = await (supabaseAdmin.from('profiles') as any)
    .select('id, full_name')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!profile?.id) return;

  const creatorEmail = await getUserEmail(supabaseAdmin, profile.id);
  if (!creatorEmail) return;

  const portal = await createBillingPortalSession({
    customerId,
    returnUrl: process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL || `${APP_URL}/dashboard/settings/billing`,
  });

  await sendPaymentFailedEmail(creatorEmail, profile.full_name || 'Creator', portal.url);
}

async function handleInvoicePaymentSucceeded(supabaseAdmin: SupabaseClient<Database>, invoice: Stripe.Invoice) {
  const customerId = normalizeCustomerId(invoice.customer);
  if (!customerId) return;

  const { data: profile } = await (supabaseAdmin.from('profiles') as any)
    .select('id, full_name')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!profile?.id) return;

  const creatorEmail = await getUserEmail(supabaseAdmin, profile.id);
  if (!creatorEmail) return;

  let planLabel = 'Pro plan';
  const { data: sub } = await (supabaseAdmin.from('subscriptions') as any)
    .select('plan')
    .eq('stripe_customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.plan === 'pro_monthly') {
    planLabel = 'Pro Monthly';
  } else if (sub?.plan === 'pro_yearly') {
    planLabel = 'Pro Yearly';
  }

  const invoiceUrl = invoice.invoice_pdf || invoice.hosted_invoice_url;
  if (!invoiceUrl) return;

  await sendPaymentReceiptEmail({
    to: creatorEmail,
    creatorName: profile.full_name || 'Creator',
    amount: formatMoney(invoice.amount_paid || 0, invoice.currency || 'usd'),
    invoiceDate: new Date(invoice.created * 1000).toLocaleDateString(),
    invoiceUrl,
    planLabel,
  });
}

async function resolveUserIdFromSubscription(supabaseAdmin: SupabaseClient<Database>, subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId) return metadataUserId;

  const customerId = normalizeCustomerId(subscription.customer);
  if (!customerId) return null;

  const { data: profile } = await (supabaseAdmin.from('profiles') as any)
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return profile?.id || null;
}

async function getUserEmail(supabaseAdmin: SupabaseClient<Database>, userId: string) {
  try {
    const result = await supabaseAdmin.auth.admin.getUserById(userId);
    return result.data.user?.email || null;
  } catch (error) {
    console.error('Failed to fetch auth user email:', error);
    return null;
  }
}

function resolvePlanFromPriceId(priceId?: string | null): SubscriptionPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID) return 'pro_monthly';
  if (priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) return 'pro_yearly';
  return null;
}

function normalizeSubscriptionStatus(status: string) {
  if (status === 'active' || status === 'canceled' || status === 'past_due' || status === 'incomplete') {
    return status;
  }
  return 'active';
}

function getTimestampIso(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function normalizeTransferId(transferData: Stripe.PaymentIntent.TransferData | null | undefined) {
  if (!transferData) return null;
  if (typeof transferData.destination === 'string') return transferData.destination;
  return transferData.destination?.id || null;
}

function normalizeCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function formatMoney(amountCents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

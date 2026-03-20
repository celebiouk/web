/**
 * Stripe SDK Configuration
 * Server-side Stripe client for API routes
 */

import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export a proxy that lazily initializes
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

// Stripe Connect configuration
export const STRIPE_CONNECT_CONFIG = {
  // Platform takes 8% fee on free tier, 0% on pro
  FREE_TIER_FEE_PERCENT: 8,
  PRO_TIER_FEE_PERCENT: 0,
  
  // OAuth scopes for Express accounts
  EXPRESS_SCOPE: 'read_write',
  
  // Account types
  ACCOUNT_TYPE: 'express' as const,
};

/**
 * Calculate platform fee for an order
 * Free tier: 8% commission
 * Pro tier: 0% commission
 */
export function calculatePlatformFee(
  amountCents: number, 
  subscriptionTier: 'free' | 'pro'
): number {
  if (subscriptionTier === 'pro') {
    return 0;
  }
  return Math.round(amountCents * (STRIPE_CONNECT_CONFIG.FREE_TIER_FEE_PERCENT / 100));
}

/**
 * Get the Stripe Connect OAuth URL for account onboarding
 */
export function getStripeConnectUrl(redirectUri: string, state: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    throw new Error('STRIPE_CONNECT_CLIENT_ID is not set');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: STRIPE_CONNECT_CONFIG.EXPRESS_SCOPE,
    redirect_uri: redirectUri,
    state: state,
  });

  return `https://connect.stripe.com/express/oauth/authorize?${params.toString()}`;
}

/**
 * Create a Stripe Express account link for onboarding
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

/**
 * Create a Stripe Express login link for managing payouts
 */
export async function createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
  return stripe.accounts.createLoginLink(accountId);
}

/**
 * Get Stripe account details
 */
export async function getAccount(accountId: string): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(accountId);
}

/**
 * Verify if account onboarding is complete
 */
export async function isAccountOnboardingComplete(accountId: string): Promise<boolean> {
  const account = await getAccount(accountId);
  return account.charges_enabled && account.payouts_enabled;
}

/**
 * Create a payment intent with Connect transfer
 */
export async function createConnectPaymentIntent(params: {
  amountCents: number;
  creatorStripeAccountId: string;
  platformFeeCents: number;
  customerId?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: 'usd',
    customer: params.customerId,
    setup_future_usage: params.customerId ? 'off_session' : undefined,
    application_fee_amount: params.platformFeeCents,
    transfer_data: {
      destination: params.creatorStripeAccountId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: params.metadata,
  });
}

export async function createPlatformPaymentIntent(params: {
  amountCents: number;
  customerId?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: 'usd',
    customer: params.customerId,
    setup_future_usage: params.customerId ? 'off_session' : undefined,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: params.metadata,
  });
}

export async function createOrUpdateCustomer(params: {
  existingCustomerId?: string | null;
  email: string;
  name?: string | null;
  metadata?: Record<string, string>;
}) {
  if (params.existingCustomerId) {
    return stripe.customers.update(params.existingCustomerId, {
      email: params.email,
      name: params.name ?? undefined,
      metadata: params.metadata,
    });
  }

  return stripe.customers.create({
    email: params.email,
    name: params.name ?? undefined,
    metadata: params.metadata,
  });
}

export async function createSubscriptionCheckoutSession(params: {
  customerId: string;
  customerEmail: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.customerId,
    customer_email: params.customerEmail,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { user_id: params.userId },
    subscription_data: {
      metadata: { user_id: params.userId },
    },
    allow_promotion_codes: true,
  });
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

export async function listCustomerInvoices(customerId: string, limit = 12) {
  return stripe.invoices.list({ customer: customerId, limit });
}

export async function retrieveSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'items.data.price'],
  });
}

export async function switchSubscriptionPrice(params: {
  subscriptionId: string;
  subscriptionItemId: string;
  newPriceId: string;
}) {
  return stripe.subscriptions.update(params.subscriptionId, {
    items: [{ id: params.subscriptionItemId, price: params.newPriceId }],
    proration_behavior: 'create_prorations',
  });
}

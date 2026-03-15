import { createClient } from '@/lib/supabase/server';
import { listCustomerInvoices, retrieveSubscription } from '@/lib/stripe';
import { BillingSettingsClient } from './client';

export const metadata = {
  title: 'Billing',
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, subscription_tier, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const profile = profileRaw as {
    id: string;
    full_name: string | null;
    subscription_tier: 'free' | 'pro';
    stripe_customer_id: string | null;
  } | null;

  const { data: subscriptionRaw } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = subscriptionRaw as {
    plan: 'free' | 'pro_monthly' | 'pro_yearly';
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  } | null;

  let cardLast4: string | null = null;
  let renewalAmountCents: number | null = null;
  let invoices: Array<{
    id: string;
    amountPaid: number;
    currency: string;
    status: string | null;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
    created: string;
  }> = [];

  try {
    if (subscription?.stripe_subscription_id) {
      const stripeSubscription = await retrieveSubscription(subscription.stripe_subscription_id);
      renewalAmountCents = stripeSubscription.items.data[0]?.price.unit_amount ?? null;
      const defaultPaymentMethod = stripeSubscription.default_payment_method;
      if (defaultPaymentMethod && typeof defaultPaymentMethod !== 'string' && defaultPaymentMethod.card) {
        cardLast4 = defaultPaymentMethod.card.last4;
      }
    }

    if (profile?.stripe_customer_id) {
      const stripeInvoices = await listCustomerInvoices(profile.stripe_customer_id, 8);
      invoices = stripeInvoices.data.map((invoice) => ({
        id: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdf: invoice.invoice_pdf || null,
        created: new Date(invoice.created * 1000).toISOString(),
      }));
    }
  } catch (error) {
    console.error('Failed to load Stripe billing data:', error);
  }

  return (
    <BillingSettingsClient
      userEmail={user.email || ''}
      profile={{
        fullName: profile?.full_name || 'Creator',
        subscriptionTier: profile?.subscription_tier || 'free',
      }}
      subscription={subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeCustomerId: subscription.stripe_customer_id,
      } : null}
      cardLast4={cardLast4}
      renewalAmountCents={renewalAmountCents}
      invoices={invoices}
    />
  );
}

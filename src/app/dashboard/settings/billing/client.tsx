'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, UpgradePrompt } from '@/components/ui';
import type { SubscriptionPlan, SubscriptionStatus, SubscriptionTier } from '@/types/supabase';
import { Check, ExternalLink, FileText, Sparkles } from 'lucide-react';

interface BillingSettingsClientProps {
  userEmail: string;
  profile: {
    fullName: string;
    subscriptionTier: SubscriptionTier;
  };
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string | null;
  } | null;
  cardLast4: string | null;
  renewalAmountCents: number | null;
  invoices: Array<{
    id: string;
    amountPaid: number;
    currency: string;
    status: string | null;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
    created: string;
  }>;
}

export function BillingSettingsClient({
  userEmail,
  profile,
  subscription,
  cardLast4,
  renewalAmountCents,
  invoices,
}: BillingSettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingAction, setLoadingAction] = useState<'checkout_monthly' | 'checkout_yearly' | 'portal' | 'switch_yearly' | null>(null);
  const success = searchParams.get('success') === 'true';
  const upgradeFeature = searchParams.get('upgrade') as 'courses' | 'customDomain' | 'unlimitedEmail' | 'advancedAnalytics' | 'bundleBuilder' | 'zeroCommission' | null;

  const isPro = profile.subscriptionTier === 'pro';
  const planLabel = useMemo(() => {
    if (!subscription) return 'Free';
    if (subscription.plan === 'pro_yearly') return 'Pro Yearly';
    if (subscription.plan === 'pro_monthly') return 'Pro Monthly';
    return 'Free';
  }, [subscription]);

  const savings = '$71.98/yr';

  async function startCheckout(plan: 'pro_monthly' | 'pro_yearly') {
    try {
      setLoadingAction(plan === 'pro_monthly' ? 'checkout_monthly' : 'checkout_yearly');
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  async function openPortal() {
    try {
      setLoadingAction('portal');
      const response = await fetch('/api/billing/create-portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Portal failed');
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  }

  async function switchToYearly() {
    try {
      setLoadingAction('switch_yearly');
      const response = await fetch('/api/billing/switch-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro_yearly' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Switch failed');
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-8">
      {success ? (
        <>
          <Confetti recycle={false} numberOfPieces={240} />
          <Card className="overflow-hidden border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/10">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="pro">You're now Pro!</Badge>
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Upgrade complete</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Courses, custom domains, advanced analytics, and 0% commission are now unlocked.</p>
                </div>
                <Link href="/dashboard/courses/new"><Button>Create your first course</Button></Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {['Courses unlocked', '0% commission live', 'Custom domain ready', 'Advanced analytics on'].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm dark:bg-gray-950/40 dark:text-gray-100">
                    <Check className="mr-2 inline h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Transparent billing, easy cancellation, and a clear breakdown of what you pay.</p>
      </div>

      {upgradeFeature ? <UpgradePrompt feature={upgradeFeature} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={isPro ? 'pro' : 'default'}>{planLabel}</Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{subscription?.status || 'active'}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{isPro ? '0% commission on all sales' : '8% commission on every sale'}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>
                {!isPro ? (
                  <Button onClick={() => startCheckout('pro_yearly')} isLoading={loadingAction === 'checkout_yearly'}>
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button variant="outline" onClick={openPortal} isLoading={loadingAction === 'portal'}>
                    Manage subscription
                  </Button>
                )}
              </div>

              {isPro && subscription ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoCard label="Renewal date" value={subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'} />
                  <InfoCard label="Renewal amount" value={renewalAmountCents ? formatMoney(renewalAmountCents) : '—'} />
                  <InfoCard label="Card" value={cardLast4 ? `•••• ${cardLast4}` : 'Managed in Stripe'} />
                </div>
              ) : null}

              {isPro && subscription?.plan === 'pro_monthly' ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Switch to yearly and save {savings}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Get the same Pro features for the lowest effective monthly price.</p>
                    </div>
                    <Button onClick={switchToYearly} isLoading={loadingAction === 'switch_yearly'}>
                      Switch to Yearly
                    </Button>
                  </div>
                </div>
              ) : null}

              {!isPro ? (
                <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-teal-50 p-6 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-gray-900 dark:to-teal-500/10">
                  <div className="mb-4 flex items-center gap-2">
                    <Badge variant="pro">Pro</Badge>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Upgrade in under 60 seconds</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Go Pro and keep more of what you earn</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">Courses, custom domains, unlimited email subscribers, advanced analytics, bundle tools, and 0% commission are all included.</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => startCheckout('pro_monthly')} isLoading={loadingAction === 'checkout_monthly'}>Start Pro Monthly</Button>
                    <Button variant="outline" onClick={() => startCheckout('pro_yearly')} isLoading={loadingAction === 'checkout_yearly'}>Get Best Value</Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isPro ? 'Invoices' : 'How commission works'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isPro ? (
                invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{new Date(invoice.created).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatMoney(invoice.amountPaid, invoice.currency)} · {invoice.status || 'paid'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invoice.hostedInvoiceUrl ? <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink className="mr-2 h-4 w-4" />Open</Button></a> : null}
                          {invoice.invoicePdf ? <a href={invoice.invoicePdf} target="_blank" rel="noreferrer"><Button size="sm"><FileText className="mr-2 h-4 w-4" />PDF</Button></a> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoices will appear here after your first renewal.</p>
                )
              ) : (
                <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-900/60">
                  <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">Example: you sell a $50 product → cele.bio takes <strong>$4.00</strong> (8%) → you receive <strong>$46.00</strong> before Stripe fees.</p>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Once you upgrade to Pro, the 8% platform fee becomes 0% immediately after Stripe confirms your subscription.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ['Digital products', 'Free', 'Pro'],
                ['1:1 bookings', 'Free', 'Pro'],
                ['Courses', '—', 'Pro'],
                ['Custom domain', '—', 'Pro'],
                ['Email subscribers', '500', 'Unlimited'],
                ['Platform commission', '8%', '0%'],
              ].map(([label, free, pro]) => (
                <div key={label} className="grid grid-cols-[1.4fr_0.7fr_0.7fr] items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                  <span className="text-center text-gray-500 dark:text-gray-400">{free}</span>
                  <span className="text-center font-semibold text-gray-900 dark:text-white">{pro}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {!isPro ? (
            <Card className="border-amber-200 dark:border-amber-500/20">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">Why creators upgrade</p>
                </div>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Courses unlock a new revenue stream</li>
                  <li>• 0% commission protects your margins</li>
                  <li>• Custom domains make your brand look premium</li>
                  <li>• Transparent billing and easy cancellation build trust</li>
                </ul>
                <Link href="/pricing" className="mt-5 block"><Button fullWidth variant="outline">View public pricing</Button></Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatMoney(amountCents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

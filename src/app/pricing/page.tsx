'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@/components/ui';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { PRICING } from '@/lib/constants';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const FAQs = [
  {
    question: 'Can I start on Free and upgrade later?',
    answer: 'Yes. Most creators start free, validate an offer, then upgrade once courses, custom domains, or 0% commission become worth it.',
  },
  {
    question: 'Do I need a credit card for the Free plan?',
    answer: 'No. Free starts at $0 and does not require a card.',
  },
  {
    question: 'How does commission work on Free?',
    answer: 'Free creators pay 8% of each sale to cele.bio. Stripe processing fees are separate and charged by Stripe.',
  },
  {
    question: 'What happens if I cancel Pro?',
    answer: 'Your account moves back to Free at the end of your billing period. Your page stays live, but Pro-only features are no longer active.',
  },
  {
    question: 'Can I switch from monthly to yearly later?',
    answer: 'Yes. You can switch from your billing settings at any time.',
  },
  {
    question: 'Does Pro remove the 8% fee on all sales?',
    answer: 'Yes. Pro sets your cele.bio commission to 0% for digital products, coaching, and courses. Stripe processing fees still apply.',
  },
  {
    question: 'How fast can I upgrade?',
    answer: 'Usually in under 60 seconds. After checkout, your Pro features unlock automatically via Stripe webhooks.',
  },
  {
    question: 'Do you support promo codes?',
    answer: 'Yes. Stripe Checkout supports promotion codes during upgrade.',
  },
];

export default function PricingPage() {
  const [billingView, setBillingView] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [loadingPlan, setLoadingPlan] = useState<'pro_monthly' | 'pro_yearly' | null>(null);
  const [canceled, setCanceled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setCanceled(params.get('canceled') === 'true');
  }, []);

  const socialProof = useMemo(() => [
    'Trusted by 10,000+ creators',
    'Creators in 42 countries',
    'Upgrade in under 60 seconds',
  ], []);

  async function handleUpgrade(plan: 'pro_monthly' | 'pro_yearly') {
    try {
      setLoadingPlan(plan);
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (response.status === 401) {
        router.push('/login?redirect=/pricing');
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert('Unable to start checkout right now. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  }

  const monthlyActive = billingView === 'monthly';
  const yearlyActive = billingView === 'yearly';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(28,231,208,0.16),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_55%)] dark:bg-gray-950">
      <section className="container-page py-6 md:py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            <BrandWordmark dotClassName="text-brand-600" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/signup"><Button size="sm">Get started free</Button></Link>
          </div>
        </nav>
      </section>

      <section className="container-page pb-16 pt-6 md:pb-24 md:pt-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="pro" className="mb-5">Billing that scales with you</Badge>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white md:text-6xl">
            Start free. Upgrade when{' '}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              keeping more revenue
            </span>{' '}
            matters.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300 md:text-xl">
            Sell products, coaching, and courses from one premium storefront. Free gets you live. Pro removes commission, unlocks courses, and gives your brand room to grow.
          </p>

          {canceled ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              Your upgrade was canceled. No changes were made to your plan.
            </div>
          ) : null}

          <div className="mx-auto mt-8 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => setBillingView('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${monthlyActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingView('yearly')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${yearlyActive ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500'}`}
            >
              Yearly · Save 30%
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {socialProof.map((item) => (
              <span key={item} className="rounded-full border border-gray-200 bg-white/80 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/70">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl gap-6 lg:grid-cols-3">
          <PricingCard
            title="Free"
            subtitle="Launch your storefront today"
            priceLabel="$0"
            suffix="/mo"
            description="Perfect for validating your audience and making your first sales."
            features={[
              'Bio link storefront (cele.bio/username)',
              'All 10 templates',
              'Sell digital products',
              '1:1 coaching / bookings',
              'Up to 500 email subscribers',
              'Basic analytics',
            ]}
            limitations={[
              'No courses',
              'No custom domain',
              'No unlimited email subscribers',
              '8% commission per sale',
            ]}
            ctaHref="/signup"
            ctaLabel="Get Started Free"
            mutedNote="No credit card required"
          />

          <PricingCard
            title="Pro Monthly"
            subtitle="Move fast, month to month"
            priceLabel="$19.99"
            suffix="/mo"
            description="Best if you want Pro today and prefer the flexibility of monthly billing."
            features={PRICING.PRO_MONTHLY.features}
            highlighted={monthlyActive}
            ctaLabel="Start Pro"
            onCta={() => handleUpgrade('pro_monthly')}
            loading={loadingPlan === 'pro_monthly'}
            mutedNote="0% commission on all sales"
          />

          <PricingCard
            title="Pro Yearly"
            subtitle="Best value"
            priceLabel="$13.99"
            suffix="/mo"
            description="The obvious choice for active creators. Save $71.98 every year versus monthly."
            features={[
              'Everything in Free',
              'Courses (unlimited)',
              'Custom domain',
              'Unlimited email subscribers',
              'Advanced analytics',
              'Bundle builder & upsells',
              'Priority support',
              '0% commission on sales',
            ]}
            highlighted={yearlyActive}
            popular
            savingsBadge="Save 30%"
            strikeThrough="$19.99/mo"
            footnote="Billed once yearly at $167.90"
            ctaLabel="Get Best Value"
            onCta={() => handleUpgrade('pro_yearly')}
            loading={loadingPlan === 'pro_yearly'}
            mutedNote="Most creators pick yearly"
          />
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white/70 py-14 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="container-page">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Frequently asked questions</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Transparent billing builds trust. Here’s exactly how cele.bio plans work.</p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {FAQs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <button
                  key={faq.question}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-5 text-left shadow-sm transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                  {isOpen ? <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{faq.answer}</p> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function PricingCard({
  title,
  subtitle,
  priceLabel,
  suffix,
  description,
  features,
  limitations,
  ctaLabel,
  ctaHref,
  onCta,
  highlighted,
  popular,
  savingsBadge,
  strikeThrough,
  footnote,
  mutedNote,
  loading,
}: {
  title: string;
  subtitle: string;
  priceLabel: string;
  suffix: string;
  description: string;
  features: readonly string[];
  limitations?: readonly string[];
  ctaLabel: string;
  ctaHref?: string;
  onCta?: () => void;
  highlighted?: boolean;
  popular?: boolean;
  savingsBadge?: string;
  strikeThrough?: string;
  footnote?: string;
  mutedNote?: string;
  loading?: boolean;
}) {
  const card = (
    <div className={`relative flex h-full flex-col rounded-3xl border bg-white p-7 shadow-sm transition ${highlighted ? 'border-brand-500 shadow-2xl shadow-brand-500/10' : 'border-gray-200'} dark:border-gray-800 dark:bg-gray-900`}>
      {popular ? (
        <>
          <div className="absolute -top-4 left-6 inline-flex rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg">
            Most Popular
          </div>
          {savingsBadge ? (
            <div className="absolute right-6 top-6 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {savingsBadge}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="mb-5">
        {strikeThrough ? <p className="mb-2 text-sm text-gray-400 line-through">{strikeThrough}</p> : null}
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">{priceLabel}</span>
          <span className="pb-2 text-gray-500 dark:text-gray-400">{suffix}</span>
        </div>
        {footnote ? <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-300">{footnote}</p> : null}
        {mutedNote ? <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{mutedNote}</p> : null}
      </div>

      <p className="mb-6 text-sm leading-7 text-gray-600 dark:text-gray-300">{description}</p>

      <div className="flex-1 space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{feature}</span>
          </div>
        ))}
        {limitations?.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-gray-400 dark:text-gray-500">
            <span className="mt-0.5 text-base leading-none">✕</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {ctaHref ? (
          <Link href={ctaHref}><Button fullWidth variant={highlighted ? 'primary' : 'outline'}>{ctaLabel}</Button></Link>
        ) : (
          <Button fullWidth onClick={onCta} isLoading={loading} variant={highlighted ? 'primary' : 'outline'}>
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );

  return card;
}

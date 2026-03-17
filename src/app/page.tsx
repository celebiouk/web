import Link from 'next/link';
import { Button } from '@/components/ui';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { 
  ShoppingBag, 
  CalendarCheck, 
  GraduationCap, 
  Palette, 
  CreditCard, 
  BarChart3,
  Sparkles,
  Check
} from 'lucide-react';

/**
 * Landing page - cele.bio homepage
 * Premium, mobile-first design showcasing the platform
 */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg relative overflow-hidden">
        {/* Navigation */}
        <nav className="container-page relative z-10 flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <BrandWordmark dotClassName="text-brand-600" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container-page pb-24 pt-20 text-center md:pb-36 md:pt-28">
          <div className="mx-auto max-w-3xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-sm font-medium text-brand-700 backdrop-blur-sm dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
              <Sparkles className="h-4 w-4" />
              The #1 storefront for creators
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Monetize your audience{' '}
              <span className="gradient-text">in minutes</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
              Create your beautiful storefront at cele.bio/you. Sell digital products, 
              book 1:1 coaching calls, and launch courses — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="w-full px-8 sm:w-auto">
                  Create Your Page — It&apos;s Free
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full px-8 sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              Trusted by 10,000+ creators · No credit card required
            </p>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding bg-gray-50 dark:bg-gray-900/50">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Everything you need to monetize
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Stop juggling multiple tools. cele.bio is your all-in-one platform.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-gray-200/80 bg-white p-6 transition-all duration-300 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:group-hover:bg-brand-500/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start for free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Free</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Perfect for getting started
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-500"> /month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">8% commission per sale</p>
              <ul className="mt-6 space-y-3">
                {['Digital products', '1:1 coaching', '500 email subscribers', 'All templates'].map(
                  (item) => (
                    <li key={item} className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="mr-3 h-5 w-5 text-success-500" />
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button variant="outline" fullWidth>
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-lg shadow-brand-500/10 dark:bg-gray-900">
              <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-3 py-1 text-sm font-medium text-white">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pro</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                For serious creators
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$13.99</span>
                <span className="text-gray-500"> /month</span>
              </div>
              <p className="mt-2 text-sm text-success-600">Billed yearly • Save 30%</p>
              <ul className="mt-6 space-y-3">
                {[
                  'Everything in Free',
                  'Online courses',
                  'Unlimited emails',
                  'Custom domain',
                  '0% commission',
                  'Advanced analytics',
                ].map((item) => (
                  <li key={item} className="flex items-center text-gray-600 dark:text-gray-400">
                    <Check className="mr-3 h-5 w-5 text-success-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button fullWidth>Upgrade to Pro</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-bg section-padding">
        <div className="container-page text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Ready to monetize your audience?
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Join thousands of creators who trust cele.bio
          </p>
          <Link href="/signup">
            <Button size="lg">Create Your Free Page</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 dark:border-gray-800">
        <div className="container-page">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              <BrandWordmark dotClassName="text-brand-600" />
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Cele.bio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: ShoppingBag,
    title: 'Digital Products',
    description:
      'Sell ebooks, templates, presets, and any digital file. Instant delivery, no hassle.',
  },
  {
    icon: CalendarCheck,
    title: '1:1 Coaching',
    description:
      'Let fans book paid calls with you. Integrate with your calendar seamlessly.',
  },
  {
    icon: GraduationCap,
    title: 'Online Courses',
    description:
      'Create and sell video courses with modules, lessons, and progress tracking.',
  },
  {
    icon: Palette,
    title: 'Beautiful Templates',
    description:
      'Choose from 10+ stunning templates. Your page looks professional in minutes.',
  },
  {
    icon: CreditCard,
    title: 'Instant Payouts',
    description:
      'Get paid directly to your bank via Stripe. No waiting for payouts.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Track views, sales, and revenue. Understand what your audience loves.',
  },
];

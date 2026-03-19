'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  ShoppingBag, 
  CalendarCheck, 
  GraduationCap, 
  Palette, 
  CreditCard, 
  BarChart3,
  Sparkles,
  Check,
  X,
  Clock,
  Flame,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Package,
  Zap,
  Star,
  AlertTriangle,
  DollarSign,
  Play,
  Sun,
  Moon
} from 'lucide-react';

// ============================================
// HOMEPAGE - CONVERSION OPTIMIZED
// ============================================

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <HowItWorks />
      <ComparisonTable />
      <TemplateShowcase />
      <FOMOCountdownFeature />
      <AffiliateMarketplaceFeature />
      <FeatureDeepDives />
      <AfricaFirstSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

// ============================================
// NAVBAR
// ============================================
function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-lg border-b border-gray-200 dark:bg-gray-950/90 dark:border-gray-800' 
        : 'bg-transparent'
    }`}>
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          <BrandWordmark dotClassName="text-brand-600" />
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/affiliate-marketplace" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            Affiliate Marketplace
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
          
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start Free — No Card Needed</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  return (
    <section className="gradient-bg relative overflow-hidden pt-24">
      <div className="container-page pb-24 pt-20 text-center md:pb-36 md:pt-28">
        <div className="mx-auto max-w-3xl animate-fade-in">
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
              <Button size="lg" className="w-full px-8 sm:w-auto group">
                Claim Your Page — It&apos;s Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full px-8 sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust Signals */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Trusted by 1,000+ creators · No credit card required · Set up in 5 minutes
          </p>
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />
    </section>
  );
}

// ============================================
// SOCIAL PROOF BAR
// ============================================
function SocialProofBar() {
  return (
    <section className="border-y border-gray-200 bg-white py-6 dark:border-gray-800 dark:bg-gray-950">
      <div className="container-page">
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-brand-400 to-accent-400 dark:border-gray-900" />
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">Be one of our founding creators</span>
              <span className="hidden sm:inline"> — limited spots available</span>
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-500" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-500" />
              <span>Start selling today</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// HOW IT WORKS
// ============================================
function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Pick your template',
      description: 'Choose from 10 stunning, mobile-first templates. Each one is designed to convert visitors into paying customers.',
      icon: Palette,
    },
    {
      number: '02',
      title: 'Add your products',
      description: 'Upload digital products, create courses, or set up 1:1 coaching slots. Pricing, descriptions, and images — all customizable.',
      icon: Package,
    },
    {
      number: '03',
      title: 'Get paid instantly',
      description: 'Share your cele.bio link anywhere. When someone buys, money goes directly to your bank via Stripe. No waiting.',
      icon: DollarSign,
    },
  ];

  return (
    <section id="how-it-works" className="section-padding bg-gray-50 dark:bg-gray-900/50">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Live in 5 minutes. Seriously.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Other platforms take weeks to set up. Cele.bio takes less time than making coffee.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-brand-500 to-brand-300" />
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                  <step.icon className="h-10 w-10" />
                </div>
                <span className="mb-2 text-sm font-bold text-brand-600">{step.number}</span>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/signup">
            <Button size="lg">
              Start Building Now — Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// COMPETITOR COMPARISON TABLE
// ============================================
function ComparisonTable() {
  const features = [
    { name: 'Free Plan', celebio: true, stan: false, beacons: true, gumroad: true },
    { name: 'Free Tier Commission', celebio: '8%', stan: '—', beacons: '9%', gumroad: '10%' },
    { name: 'Paid Plan Price', celebio: '$19.99/mo', stan: '$29–$99/mo', beacons: '$10–$30/mo', gumroad: 'No paid plan' },
    { name: 'Commission on Paid Plan', celebio: '0%', stan: '0%', beacons: '9%', gumroad: '10% always', highlight: true },
    { name: 'Courses', celebio: true, stan: false, beacons: true, gumroad: false, celebioLabel: 'Pro' },
    { name: '1:1 Bookings', celebio: true, stan: true, beacons: true, gumroad: false, celebioLabel: 'All plans' },
    { name: 'Affiliate Marketplace', celebio: true, stan: false, beacons: false, gumroad: false, celebioLabel: 'Built-in' },
    { name: 'FOMO Countdown Pricing', celebio: true, stan: false, beacons: false, gumroad: false, celebioLabel: 'Built-in' },
    { name: 'Email Marketing', celebio: true, stan: false, beacons: true, gumroad: false, celebioLabel: 'Built-in' },
    { name: 'Bundle Builder', celebio: true, stan: false, beacons: false, gumroad: false, celebioLabel: 'Pro' },
    { name: 'African Creator Support', celebio: true, stan: 'warn', beacons: 'warn', gumroad: 'warn' },
    { name: 'Custom Domain', celebio: true, stan: true, beacons: true, gumroad: false, celebioLabel: 'Pro' },
    { name: '10 Premium Templates', celebio: true, stan: 'warn', beacons: 'warn', gumroad: false, celebioLabel: 'All plans' },
  ];

  type CellValue = boolean | string;

  function renderCell(value: CellValue, label?: string) {
    if (value === true) {
      return (
        <span className="flex items-center justify-center gap-1 text-success-600 font-medium">
          <Check className="h-5 w-5" />
          {label && <span className="text-xs">{label}</span>}
        </span>
      );
    }
    if (value === false) {
      return <X className="h-5 w-5 text-gray-400 mx-auto" />;
    }
    if (value === 'warn') {
      return <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" />;
    }
    return <span className="text-sm">{value}</span>;
  }

  return (
    <section className="section-padding bg-white dark:bg-gray-950">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Why creators are choosing cele.bio
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Every other platform either charges you monthly AND takes a cut — or locks you out of the best features entirely. Cele.bio doesn&apos;t.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Competitor pricing based on publicly available information as of 2026. Commission rates and plan features may change. Always verify on their websites.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="sticky left-0 bg-gray-50 dark:bg-gray-900 p-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Feature
                </th>
                <th className="bg-brand-50 dark:bg-brand-950 p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Star className="h-4 w-4 text-brand-600" />
                    <span className="font-bold text-brand-700 dark:text-brand-300">Cele.bio</span>
                    <span className="text-xs text-brand-600">Best Choice</span>
                  </div>
                </th>
                <th className="bg-gray-50 dark:bg-gray-900 p-4 text-center">
                  <span className="font-medium text-gray-500">Stan.store</span>
                </th>
                <th className="bg-gray-50 dark:bg-gray-900 p-4 text-center">
                  <span className="font-medium text-gray-500">Beacons.ai</span>
                </th>
                <th className="bg-gray-50 dark:bg-gray-900 p-4 text-center">
                  <span className="font-medium text-gray-500">Gumroad</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
                    feature.highlight ? 'bg-success-50/50 dark:bg-success-500/5' : ''
                  }`}
                >
                  <td className="sticky left-0 bg-white dark:bg-gray-950 p-4 text-sm font-medium text-gray-900 dark:text-white">
                    {feature.name}
                  </td>
                  <td className="bg-brand-50/50 dark:bg-brand-950/50 p-4 text-center">
                    {renderCell(feature.celebio, feature.celebioLabel)}
                  </td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                    {renderCell(feature.stan)}
                  </td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                    {renderCell(feature.beacons)}
                  </td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                    {renderCell(feature.gumroad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats Callouts */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 p-6 text-center">
            <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">Save $109/yr</p>
            <p className="mt-2 text-sm text-brand-600 dark:text-brand-400">
              vs Stan.store&apos;s cheapest plan — with more features included
            </p>
          </div>
          <div className="rounded-xl bg-success-50 dark:bg-success-500/10 p-6 text-center">
            <p className="text-3xl font-bold text-success-700 dark:text-success-300">Keep 2% more per sale</p>
            <p className="mt-2 text-sm text-success-600 dark:text-success-400">
              Gumroad takes 10%. Beacons takes 9%. Cele.bio free tier takes only 8% — and Pro takes nothing.
            </p>
          </div>
          <div className="rounded-xl bg-accent-50 dark:bg-accent-500/10 p-6 text-center">
            <p className="text-3xl font-bold text-accent-700 dark:text-accent-300">Only platform with all of this</p>
            <p className="mt-2 text-sm text-accent-600 dark:text-accent-400">
              Affiliate marketplace, FOMO countdowns, email marketing, courses, and bookings — built in.
            </p>
          </div>
        </div>

        {/* Kicker */}
        <div className="mt-12 rounded-2xl bg-gray-900 p-8 text-center dark:bg-gray-800">
          <p className="text-lg text-white md:text-xl leading-relaxed">
            Beacons still charges you <span className="text-red-400 font-semibold">9% commission</span> even on their paid plan. 
            Stan.store has <span className="text-red-400 font-semibold">no free plan</span> and costs $29/month minimum. 
            Gumroad takes <span className="text-red-400 font-semibold">10% — forever</span>. 
            Cele.bio Pro is <span className="text-success-400 font-semibold">$19.99/month with zero commission</span>. 
            The choice is obvious.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================
// TEMPLATE SHOWCASE
// ============================================
function TemplateShowcase() {
  const templates = [
    { name: 'Minimal Clean', slug: 'minimal-clean', category: 'Coaches', color: 'bg-gray-100' },
    { name: 'Bold Creator', slug: 'bold-creator', category: 'Influencers', color: 'bg-brand-100' },
    { name: 'Course Academy', slug: 'course-academy', category: 'Educators', color: 'bg-blue-100' },
    { name: 'Dark Premium', slug: 'dark-premium', category: 'Artists', color: 'bg-gray-900' },
    { name: 'Warm & Approachable', slug: 'warm-approachable', category: 'Wellness', color: 'bg-orange-100' },
    { name: 'Corporate Pro', slug: 'corporate-pro', category: 'Business', color: 'bg-slate-100' },
    { name: 'Vibrant Social', slug: 'vibrant-social', category: 'Gen-Z', color: 'bg-pink-100' },
    { name: 'Editorial', slug: 'editorial', category: 'Writers', color: 'bg-amber-100' },
    { name: 'Tech Vibe', slug: 'tech-vibe', category: 'Dev Educators', color: 'bg-cyan-100' },
    { name: 'Luxury', slug: 'luxury', category: 'High-ticket', color: 'bg-yellow-100' },
  ];

  return (
    <section id="templates" className="section-padding bg-gray-50 dark:bg-gray-900/50">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            10 stunning templates. Zero design skills needed.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Each template is mobile-first, conversion-optimized, and ready to make you look like a pro — even if you&apos;ve never touched a website builder.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {templates.map((template, i) => (
            <div 
              key={i}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className={`aspect-[3/4] ${template.color} relative`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Palette className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="outline" className="bg-white">
                    <Play className="h-4 w-4 mr-1" /> Preview
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Best for {template.category}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/signup">
            <Button size="lg">
              Choose Your Template
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FOMO COUNTDOWN FEATURE
// ============================================
function FOMOCountdownFeature() {
  const [time, setTime] = useState({ hours: 2, minutes: 14, seconds: 33 });
  const spots = 7;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="features" className="section-padding bg-white dark:bg-gray-950">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 mb-6">
              <Flame className="h-4 w-4" />
              Exclusive Feature
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Turn browsers into buyers with FOMO pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Your visitors are thinking about it. They want to buy. They just need a reason to act <em>now</em>. 
              Give them that reason with countdown timers and limited spots.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Timer Mode:</strong>
                  <span className="text-gray-600 dark:text-gray-400"> Set a countdown. When it hits zero, price goes up automatically.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Quantity Mode:</strong>
                  <span className="text-gray-600 dark:text-gray-400"> &quot;Only X spots left.&quot; Creates scarcity that drives action.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-gray-900 dark:text-white">Run both at once:</strong>
                  <span className="text-gray-600 dark:text-gray-400"> Whichever expires first triggers the price increase.</span>
                </div>
              </li>
            </ul>

            <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 p-4 border border-orange-200 dark:border-orange-500/20">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                <strong>Stan.store doesn&apos;t have this.</strong> Neither does Beacons or Gumroad. 
                This feature alone can double your conversion rate.
              </p>
            </div>
          </div>

          {/* Demo Widget */}
          <div className="relative">
            <div className="rounded-2xl bg-gray-900 p-6 shadow-2xl">
              <div className="rounded-xl bg-gray-800 p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-brand-500 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Social Media Growth Guide</h4>
                    <p className="text-sm text-gray-400">The complete blueprint</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">$29</span>
                    <span className="text-gray-400 line-through ml-2">$49</span>
                  </div>
                  <span className="text-success-400 text-sm font-medium">Save 40%</span>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 mb-3 text-orange-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Price goes up in</span>
                  <span className="font-mono font-bold">
                    {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
                  </span>
                </div>

                {/* Spots */}
                <div className="flex items-center gap-2 text-red-400">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">Only {spots} spots left at this price</span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Get Instant Access
              </Button>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-brand-500/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// AFFILIATE MARKETPLACE FEATURE
// ============================================
function AffiliateMarketplaceFeature() {
  const mockProducts = [
    { title: 'Instagram Growth Masterclass', creator: 'Sarah Chen', price: 97, commission: 30, sales: 1247 },
    { title: 'Notion Templates Bundle', creator: 'Alex Rivera', price: 39, commission: 50, sales: 892 },
    { title: 'Video Editing Presets', creator: 'Jordan Kim', price: 29, commission: 40, sales: 2341 },
    { title: 'Email Marketing Course', creator: 'Maya Johnson', price: 149, commission: 25, sales: 456 },
  ];

  return (
    <section className="section-padding bg-gray-50 dark:bg-gray-900/50">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Demo Marketplace */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Affiliate Marketplace</h4>
              </div>
              <div className="p-4 space-y-3">
                {mockProducts.map((product, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-6 w-6 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">{product.title}</h5>
                      <p className="text-xs text-gray-500">{product.creator} · {product.sales.toLocaleString()} sold</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-success-600">
                        Earn ${(product.price * product.commission / 100).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500">{product.commission}% commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-success-100 px-3 py-1 text-sm font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400 mb-6">
              <DollarSign className="h-4 w-4" />
              Second Income Stream
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Earn without creating. Promote other creators&apos; products.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Don&apos;t have products yet? No problem. Browse our marketplace, find products you believe in, 
              add them to your cele.bio page, and earn up to 50% commission on every sale.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">50%</p>
                <p className="text-xs text-gray-500">Max commission</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24hr</p>
                <p className="text-xs text-gray-500">Next-day payouts</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">Real-time</p>
                <p className="text-xs text-gray-500">Tracking</p>
              </div>
            </div>

            <Link href="/affiliate-marketplace">
              <Button size="lg">
                Explore the Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURE DEEP DIVES
// ============================================
function FeatureDeepDives() {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Digital Products That Sell Themselves',
      description: 'Upload any file — PDFs, videos, templates, presets, audio. Set your price, write your description, and watch sales roll in. Instant delivery, no technical headaches. Your buyers get immediate access, you get paid instantly.',
      highlight: 'Sell ebooks, Notion templates, Lightroom presets, video courses, audio files, and more.',
    },
    {
      icon: CalendarCheck,
      title: '1:1 Coaching That Fills Your Calendar',
      description: 'Stop chasing clients through DMs. Let them book and pay in one click. Set your availability, your rates, and your session lengths. Automatic calendar sync, reminder emails, and payment collection. You just show up.',
      highlight: 'Integrates with Google Calendar and Zoom. Automatic reminders for both parties.',
    },
    {
      icon: GraduationCap,
      title: 'Courses That Build Your Empire',
      description: 'Create professional courses with video modules, lesson progress tracking, and student engagement tools. Drip content over time or give instant access. Build a recurring revenue stream that grows while you sleep.',
      highlight: 'Pro feature: Host courses with HD video, quizzes, certificates, and student discussions.',
    },
    {
      icon: Mail,
      title: 'Email Marketing Built Right In',
      description: 'Other platforms make you pay extra for email. Not us. Collect subscribers, send broadcasts, segment your audience, and track open rates. All included. Turn followers into paying customers with the power of email.',
      highlight: 'Free: 500 subscribers. Pro: Unlimited subscribers + advanced automations.',
    },
    {
      icon: BarChart3,
      title: 'Analytics That Actually Help You Sell More',
      description: 'See what&apos;s working. Track views, clicks, conversions, and revenue in real-time. Understand which products are hot, which pages convert, and where your traffic comes from. Data-driven decisions = more money.',
      highlight: 'Pro users get conversion funnels, audience insights, and revenue forecasting.',
    },
    {
      icon: Package,
      title: 'Bundle Builder for Bigger Sales',
      description: 'Combine multiple products into irresistible bundles. Offer a discount on the package, increase your average order value, and give customers more reasons to buy. Smart creators use bundles to 2x their revenue.',
      highlight: 'Pro feature: Create unlimited bundles with dynamic pricing and limited-time offers.',
    },
  ];

  return (
    <section className="section-padding bg-white dark:bg-gray-950">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Stop paying for 10 different tools. Cele.bio has it all — and it actually works together.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:group-hover:bg-brand-500/20">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {feature.description}
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">
                {feature.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// AFRICA FIRST SECTION
// ============================================
function AfricaFirstSection() {
  const countries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Tanzania'];

  return (
    <section className="section-padding bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-green-200 mb-6">
              <Globe className="h-4 w-4" />
              Global Access
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Built for the world. Built for Africa.
            </h2>
            <p className="text-lg text-green-100 mb-8">
              Stan.store and most creator platforms have limited support for African creators — restricted payment methods, 
              no local currency support, complex payout processes. Cele.bio is different.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <span>Nigerian creators welcome — Stripe available where supported</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <span>Sell in USD, receive payouts in your local currency</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <span>No geographic restrictions on who can sign up</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <span>Built by people who understand the African creator economy</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400 shrink-0" />
                  <span>Paystack integration</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                    Coming Soon
                  </span>
                </div>
              </li>
            </ul>

            <Link href="/signup">
              <Button size="lg" className="bg-white text-green-900 hover:bg-green-100">
                Join African Creators on Cele.bio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {countries.map((country, i) => (
              <div 
                key={i}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
              >
                {country}
              </div>
            ))}
            <div className="rounded-full bg-brand-500/30 px-4 py-2 text-sm font-medium">
              + 48 more countries
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING SECTION
// ============================================
function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);
  const [expectedRevenue, setExpectedRevenue] = useState(1000);
  const commission = Math.round(expectedRevenue * 0.08);

  return (
    <section id="pricing" className="section-padding bg-gray-50 dark:bg-gray-900/50">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Simple pricing. No surprises.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Start free, upgrade when you&apos;re ready. No credit card required.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 rounded-full bg-gray-200 p-1 dark:bg-gray-800">
            <button
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !isYearly ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                isYearly ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Yearly
              <span className="rounded-full bg-success-500 px-2 py-0.5 text-xs text-white">Save 30%</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Free</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Perfect for getting started</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
              <span className="text-gray-500"> /month</span>
            </div>
            <p className="mt-2 text-sm text-red-500 font-medium">8% commission per sale</p>
            
            {/* Commission Calculator */}
            <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-500/10 p-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
                I expect to make $<span className="font-bold">{expectedRevenue.toLocaleString()}</span>/month
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={expectedRevenue}
                onChange={(e) => setExpectedRevenue(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                You&apos;ll pay cele.bio ${commission}/mo in commission
              </p>
              <p className="text-xs text-gray-500 mt-1">Go Pro and keep it all →</p>
            </div>

            <ul className="mt-6 space-y-3">
              {['Digital products', '1:1 coaching', '500 email subscribers', 'All 10 templates', 'Basic analytics'].map(
                (item) => (
                  <li key={item} className="flex items-center text-gray-600 dark:text-gray-400">
                    <Check className="mr-3 h-5 w-5 text-success-500 shrink-0" />
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

          {/* Pro Monthly */}
          <div className={`rounded-2xl border bg-white p-8 dark:bg-gray-900 ${
            !isYearly ? 'border-2 border-brand-500 shadow-lg shadow-brand-500/10' : 'border-gray-200 dark:border-gray-800 opacity-75'
          }`}>
            {!isYearly && (
              <div className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-sm font-medium text-white">
                Selected
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pro Monthly</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">For growing creators</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$19.99</span>
              <span className="text-gray-500"> /month</span>
            </div>
            <p className="mt-2 text-sm text-success-600 font-medium">0% commission — keep everything</p>
            <ul className="mt-6 space-y-3">
              {[
                'Everything in Free',
                'Online courses',
                'Unlimited email subscribers',
                'Custom domain',
                '0% commission',
                'Advanced analytics',
                'Bundle builder',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-center text-gray-600 dark:text-gray-400">
                  <Check className="mr-3 h-5 w-5 text-success-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup?plan=pro-monthly" className="mt-8 block">
              <Button fullWidth variant={isYearly ? 'outline' : 'primary'}>
                Start Pro Monthly
              </Button>
            </Link>
          </div>

          {/* Pro Yearly */}
          <div className={`relative rounded-2xl border bg-white p-8 dark:bg-gray-900 ${
            isYearly ? 'border-2 border-brand-500 shadow-lg shadow-brand-500/10' : 'border-gray-200 dark:border-gray-800'
          }`}>
            <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-3 py-1 text-sm font-medium text-white">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pro Yearly</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Best value for serious creators</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$13.99</span>
              <span className="text-gray-500"> /month</span>
            </div>
            <p className="mt-2 text-sm text-success-600 font-medium">Billed yearly at $167.90 · Save 30%</p>
            <ul className="mt-6 space-y-3">
              {[
                'Everything in Free',
                'Online courses',
                'Unlimited email subscribers',
                'Custom domain',
                '0% commission',
                'Advanced analytics',
                'Bundle builder',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-center text-gray-600 dark:text-gray-400">
                  <Check className="mr-3 h-5 w-5 text-success-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup?plan=pro-yearly" className="mt-8 block">
              <Button fullWidth>
                Start Pro Yearly — Save 30%
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS SECTION
// ============================================
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I made my first $1,000 in the first week. The templates are gorgeous and the checkout experience is seamless.",
      name: "Sarah Chen",
      role: "Course Creator",
    },
    {
      quote: "Finally a platform that works in Nigeria! I've been waiting for something like cele.bio for years.",
      name: "Chinonso Okeke",
      role: "Digital Marketer",
    },
    {
      quote: "The FOMO countdown feature literally doubled my conversion rate overnight. This is a game changer.",
      name: "Jordan Kim",
      role: "Coach & Consultant",
    },
  ];

  return (
    <section className="section-padding bg-white dark:bg-gray-950">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Creators love cele.bio
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Join thousands of creators who are building their businesses on cele.bio.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                &quot;{testimonial.quote}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-400" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FAQ SECTION
// ============================================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is cele.bio really free to start?",
      answer: "Yes! You can create your page, add products, and start selling immediately — no credit card required. The free plan has an 8% commission per sale. When you're ready to keep 100% of your revenue, upgrade to Pro."
    },
    {
      question: "How do I get paid?",
      answer: "Payments go directly to your Stripe account. When someone buys from your page, the money lands in your connected bank account — typically within 2-3 business days. No waiting for monthly payouts."
    },
    {
      question: "What's the difference between Free and Pro?",
      answer: "Free includes digital products, 1:1 coaching, 500 email subscribers, and all templates with an 8% commission. Pro adds online courses, unlimited email subscribers, custom domains, bundle builder, advanced analytics, and 0% commission."
    },
    {
      question: "Does cele.bio work in my country?",
      answer: "Cele.bio works globally! We support creators in over 50 countries including Nigeria, Ghana, Kenya, South Africa, the UK, US, Canada, and more. Payments are processed via Stripe, with Paystack integration coming soon for African creators."
    },
    {
      question: "How does the Affiliate Marketplace work?",
      answer: "The Affiliate Marketplace lets you earn commissions by promoting other creators' products. Browse products, add them to your page under a 'Promoting' section, and earn up to 50% commission on every sale. Payouts are next-day."
    },
    {
      question: "What's the FOMO countdown feature?",
      answer: "FOMO countdowns let you create urgency with timer-based pricing or limited spots. Set a countdown timer or limit the number of buyers at a discounted price. When it expires, the price automatically increases. It's proven to boost conversions."
    },
    {
      question: "Can I use my own domain?",
      answer: "Yes! Pro users can connect a custom domain (like yourbrand.com) to their cele.bio page. Your customers see your brand, not ours. Domain connection takes just a few minutes to set up."
    },
    {
      question: "How do I cancel if it's not for me?",
      answer: "Cancel anytime from your dashboard — no questions asked, no hidden fees, no awkward conversations. If you're on a paid plan, you'll keep access until the end of your billing period."
    },
  ];

  return (
    <section className="section-padding bg-gray-50 dark:bg-gray-900/50">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about cele.bio.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                {openIndex === i ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FINAL CTA
// ============================================
function FinalCTA() {
  return (
    <section className="gradient-bg section-padding">
      <div className="container-page text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
          Your audience is waiting.
        </h2>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Every day you wait is a day of sales you&apos;re leaving on the table. 
          Set up your cele.bio page in 5 minutes and start earning today.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="px-8">
              Claim Your Free Page Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          No credit card required · Set up in 5 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  return (
    <footer className="border-t border-gray-200 py-12 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container-page">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              <BrandWordmark dotClassName="text-brand-600" />
            </Link>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              The creator platform built for the next generation.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="#features" className="hover:text-brand-600">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-brand-600">Pricing</Link></li>
              <li><Link href="#templates" className="hover:text-brand-600">Templates</Link></li>
              <li><Link href="/affiliate-marketplace" className="hover:text-brand-600">Affiliate Marketplace</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-brand-600">About</Link></li>
              <li><Link href="/blog" className="hover:text-brand-600">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-brand-600">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-brand-600">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-600">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Cele.bio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com/celebio" className="text-gray-400 hover:text-brand-600">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
            </a>
            <a href="https://instagram.com/celebio" className="text-gray-400 hover:text-brand-600">
              <span className="sr-only">Instagram</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

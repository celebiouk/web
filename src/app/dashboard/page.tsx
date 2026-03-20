import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist';
import { UpgradeNudgeBanner, type DashboardNudge } from '@/components/dashboard/upgrade-nudge-banner';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
  ArrowUpRight,
  ArrowRight,
  Package,
  LayoutGrid,
  Mail,
  Sparkles,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { Profile } from '@/types/supabase';
import { ensureUpgradeNudge } from '@/lib/nudges';
import { cn } from '@/lib/utils';
import { isPayoutSetupComplete } from '@/lib/payout-routing';

export const metadata = {
  title: 'Dashboard',
};

/**
 * Premium Dashboard Home Page
 * Vercel/Linear inspired design - clean, data-driven, sophisticated
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;
  const payoutSetupComplete = isPayoutSetupComplete(profile as any);

  // Get products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: todayOrders }, { count: todayPageViews }, { count: newSubscribersToday }, { data: recentOrdersRaw }, { data: upcomingBookingsRaw }] = await Promise.all([
    (supabase.from('orders') as any)
      .select('id,amount_cents,status,created_at,buyer_email,products(title)')
      .eq('creator_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString()),
    (supabase.from('analytics_events') as any)
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('event_type', 'page_view')
      .gte('created_at', todayStart.toISOString()),
    (supabase.from('email_subscribers') as any)
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('is_active', true)
      .gte('subscribed_at', todayStart.toISOString()),
    (supabase.from('orders') as any)
      .select('id,amount_cents,buyer_email,status,created_at,products(title)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    (supabase.from('bookings') as any)
      .select('id,buyer_name,scheduled_at,status,amount_cents')
      .eq('creator_id', user.id)
      .eq('status', 'confirmed')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(3),
  ]);

  const todayRevenueCents = (todayOrders || []).reduce((sum: number, row: { amount_cents: number }) => sum + row.amount_cents, 0);
  const hasFirstSale = (todayOrders?.length || 0) > 0 || false;

  // Determine checklist items
  const checklistItems = [
    {
      id: 'template',
      label: 'Choose a template',
      isCompleted: !!profile?.template_id,
      href: '/dashboard/page',
    },
    {
      id: 'avatar',
      label: 'Upload profile photo',
      isCompleted: !!profile?.avatar_url,
      href: '/dashboard/settings',
    },
    {
      id: 'bio',
      label: 'Write your bio',
      isCompleted: !!profile?.bio && profile.bio.length > 10,
      href: '/dashboard/settings',
    },
    {
      id: 'product',
      label: 'Add your first product',
      isCompleted: (productsCount ?? 0) > 0,
      href: '/dashboard/products',
    },
    {
      id: 'payout',
      label: 'Add payout bank details',
      isCompleted: payoutSetupComplete,
      href: '/dashboard/settings/payments',
    },
    {
      id: 'share',
      label: 'Share your page',
      isCompleted: Boolean(profile?.username),
      href: `/${profile?.username || ''}`,
    },
    {
      id: 'sale',
      label: 'Get first sale',
      isCompleted: hasFirstSale,
      href: '/dashboard/orders',
    },
  ];

  const completedCount = checklistItems.filter((item) => item.isCompleted).length;
  const isOnboardingComplete = completedCount === checklistItems.length;

  let dashboardNudge: DashboardNudge | null = null;

  if (profile?.subscription_tier === 'free') {
    const { data: nudges } = await (supabase.from('upgrade_nudges') as any)
      .select('nudge_type, clicked, converted')
      .eq('user_id', user.id)
      .eq('converted', false)
      .order('shown_at', { ascending: false });

    const nudgeMap = new Map<string, { clicked: boolean }>();
    for (const nudge of nudges || []) {
      nudgeMap.set(nudge.nudge_type, { clicked: nudge.clicked });
    }

    let subscriberCount = 0;
    try {
      const { count } = await (supabase.from('email_subscribers') as any)
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id);
      subscriberCount = count || 0;
    } catch {
      subscriberCount = 0;
    }

    if (subscriberCount >= 400 && !nudgeMap.has('email_limit_warning')) {
      await ensureUpgradeNudge(serviceSupabase as any, user.id, 'email_limit_warning');
      nudgeMap.set('email_limit_warning', { clicked: false });
    }

    if (nudgeMap.has('third_sale') && !nudgeMap.get('third_sale')?.clicked) {
      const { data: completedOrders } = await (supabase.from('orders') as any)
        .select('amount_cents, platform_fee_cents')
        .eq('creator_id', user.id)
        .eq('status', 'completed');

      const totalRevenue = (completedOrders || []).reduce((sum: number, row: { amount_cents: number }) => sum + row.amount_cents, 0);
      const totalCommission = (completedOrders || []).reduce((sum: number, row: { platform_fee_cents: number }) => sum + row.platform_fee_cents, 0);

      dashboardNudge = {
        type: 'third_sale',
        title: `You've earned $${(totalRevenue / 100).toFixed(2)} and paid $${(totalCommission / 100).toFixed(2)} in commission`,
        description: 'You are gaining traction. Go Pro to keep 100% of every new sale.',
        ctaLabel: 'Go Pro and keep more',
      };
    } else if (nudgeMap.has('first_sale') && !nudgeMap.get('first_sale')?.clicked) {
      dashboardNudge = {
        type: 'first_sale',
        title: 'You made your first sale!',
        description: 'Upgrade to Pro to keep 100% of future revenue and unlock courses.',
        ctaLabel: 'Upgrade to Pro',
      };
    } else if (nudgeMap.has('email_limit_warning') && !nudgeMap.get('email_limit_warning')?.clicked) {
      dashboardNudge = {
        type: 'email_limit_warning',
        title: 'You are at 400/500 email subscribers',
        description: 'Free is capped at 500 subscribers. Upgrade to Pro for unlimited list growth.',
        ctaLabel: 'Unlock unlimited subscribers',
      };
    }
  }

  const isPro = profile?.subscription_tier === 'pro';

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Creator'}
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Here's what's happening with your page today
          </p>
        </div>
        <Link
          href={`/${profile?.username}`}
          target="_blank"
          className="group inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[13px] font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
          View Page
          <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Onboarding Checklist - Show only if not complete */}
      {!isOnboardingComplete && (
        <OnboardingChecklist
          items={checklistItems}
          completedCount={completedCount}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Revenue Today"
          value={`$${(todayRevenueCents / 100).toFixed(2)}`}
          iconColor="text-emerald-400"
          iconBgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={ShoppingBag}
          label="Products"
          value={`${productsCount ?? 0}`}
          iconColor="text-indigo-400"
          iconBgColor="bg-indigo-500/10"
        />
        <StatCard
          icon={Users}
          label="New Subscribers"
          value={`${newSubscribersToday || 0}`}
          iconColor="text-amber-400"
          iconBgColor="bg-amber-500/10"
        />
        <StatCard
          icon={Eye}
          label="Page Views"
          value={`${todayPageViews || 0}`}
          iconColor="text-purple-400"
          iconBgColor="bg-purple-500/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/dashboard/products"
          icon={Package}
          title="Add Product"
          description="Start selling digital products"
        />
        <QuickActionCard
          href="/dashboard/page"
          icon={LayoutGrid}
          title="Edit Page"
          description="Customize your storefront"
        />
        <QuickActionCard
          href="/dashboard/email/broadcasts/new"
          icon={Mail}
          title="Send Broadcast"
          description="Email your subscribers"
        />
        <QuickActionCard
          href="/dashboard/bookings"
          icon={Calendar}
          title="Manage Bookings"
          description="View your schedule"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#111113]">
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-zinc-100">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="group flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="p-3">
            {(recentOrdersRaw || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50">
                  <ShoppingBag className="h-5 w-5 text-zinc-600" strokeWidth={1.75} />
                </div>
                <p className="mt-3 text-[13px] text-zinc-500">No orders yet</p>
                <p className="mt-1 text-[12px] text-zinc-600">Share your page to get your first sale</p>
              </div>
            ) : (
              <div className="space-y-1">
                {(recentOrdersRaw || []).map((order: { id: string; buyer_email: string; amount_cents: number; created_at: string; products?: { title?: string } }) => (
                  <div
                    key={order.id}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-zinc-200">
                        {order.products?.title || 'Product'}
                      </p>
                      <p className="truncate text-[12px] text-zinc-500">{order.buyer_email}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-mono text-[13px] font-medium text-zinc-200">
                        ${(order.amount_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#111113]">
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-zinc-100">Upcoming Bookings</h2>
            <Link
              href="/dashboard/bookings"
              className="group flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="p-3">
            {(upcomingBookingsRaw || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50">
                  <Calendar className="h-5 w-5 text-zinc-600" strokeWidth={1.75} />
                </div>
                <p className="mt-3 text-[13px] text-zinc-500">No upcoming bookings</p>
                <p className="mt-1 text-[12px] text-zinc-600">Add a booking product to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {(upcomingBookingsRaw || []).map((booking: { id: string; buyer_name: string; scheduled_at: string; amount_cents: number }) => (
                  <div
                    key={booking.id}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-zinc-200">
                        {booking.buyer_name}
                      </p>
                      <p className="truncate text-[12px] text-zinc-500">
                        {new Date(booking.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="ml-4 font-mono text-[13px] font-medium text-zinc-200">
                      ${(booking.amount_cents / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Banner - Free users only */}
      {!isPro && (
        <div className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                <Sparkles className="h-5 w-5 text-indigo-400" strokeWidth={1.75} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    Pro
                  </span>
                  <span className="text-[14px] font-medium text-zinc-200">
                    Unlock courses & 0% commission
                  </span>
                </div>
                <p className="text-[13px] text-zinc-500">
                  Go Pro for just $13.99/month (billed yearly) and keep 100% of your earnings
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings?tab=billing"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-indigo-400"
            >
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
      )}

      {dashboardNudge ? <UpgradeNudgeBanner nudge={dashboardNudge} /> : null}
    </div>
  );
}

/**
 * Premium Stat Card Component
 */
function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBgColor,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  iconColor: string;
  iconBgColor: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-5">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBgColor)}>
          <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="mt-0.5 font-mono text-xl font-semibold text-zinc-100">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium Quick Action Card
 */
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-800/60 bg-[#111113] p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80 transition-colors group-hover:bg-zinc-700/80">
            <Icon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-300" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-[14px] font-medium text-zinc-200 group-hover:text-white">
              {title}
            </h3>
            <p className="text-[12px] text-zinc-500">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
      </div>
    </Link>
  );
}

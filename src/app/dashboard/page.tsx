import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist';
import { UpgradeNudgeBanner, type DashboardNudge } from '@/components/dashboard/upgrade-nudge-banner';
import { ArrowRight, ExternalLink, Package, Calendar, DollarSign } from 'lucide-react';
import type { Profile } from '@/types/supabase';
import { ensureUpgradeNudge } from '@/lib/nudges';

export const metadata = {
  title: 'Dashboard',
};

/**
 * Dashboard home page
 * Shows overview, stats, and onboarding checklist
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
      id: 'stripe',
      label: 'Connect Stripe',
      isCompleted: Boolean(profile?.stripe_account_id),
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
        title: '🎉 You made your first sale',
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

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Creator'}!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Here&apos;s what&apos;s happening with your page
          </p>
        </div>
        <Link href={`/${profile?.username}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Page
          </Button>
        </Link>
      </div>

      {/* Onboarding Checklist - Show only if not complete */}
      {!isOnboardingComplete && (
        <OnboardingChecklist
          items={checklistItems}
          completedCount={completedCount}
        />
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Revenue Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(todayRevenueCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
                <Package className="h-6 w-6 text-success-600 dark:text-success-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Products
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productsCount ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  New Subscribers Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {newSubscribersToday || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page Views Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayPageViews || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card hoverable>
          <Link href="/dashboard/products" className="block">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Add Your First Product
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start selling digital products or coaching sessions
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card hoverable>
          <Link href="/dashboard/page" className="block">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Customize Your Page
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Edit your template, colors, and content
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card hoverable>
          <Link href="/dashboard/email/broadcasts/new" className="block">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    New Broadcast
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Send an email campaign now
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card hoverable>
          <Link href={`/${profile?.username || ''}`} className="block" target="_blank">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    View My Page
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    See your storefront live
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card hoverable>
          <Link href="/dashboard/preview" className="block">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Share Link
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Copy and share your URL
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentOrdersRaw || []).length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              (recentOrdersRaw || []).map((order: { id: string; buyer_email: string; amount_cents: number; created_at: string; products?: { title?: string } }) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{order.products?.title || 'Product'}</p>
                    <p className="text-xs text-gray-500">{order.buyer_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">${(order.amount_cents / 100).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(upcomingBookingsRaw || []).length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming bookings.</p>
            ) : (
              (upcomingBookingsRaw || []).map((booking: { id: string; buyer_name: string; scheduled_at: string; amount_cents: number }) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{booking.buyer_name}</p>
                    <p className="text-xs text-gray-500">{new Date(booking.scheduled_at).toLocaleString()}</p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">${(booking.amount_cents / 100).toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Banner - Show for free users */}
      {profile?.subscription_tier === 'free' && (
        <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-accent-50 dark:border-brand-800 dark:from-brand-950/30 dark:to-accent-950/30">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="pro">PRO</Badge>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Upgrade to unlock courses & 0% commission
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go Pro for just $13.99/month (billed yearly) and keep 100% of
                  your earnings
                </p>
              </div>
              <Link href="/dashboard/settings/billing">
                <Button>Upgrade Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {dashboardNudge ? <UpgradeNudgeBanner nudge={dashboardNudge} /> : null}
    </div>
  );
}

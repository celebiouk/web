import { createClient } from '@/lib/supabase/server';
import { TrendingUp, Users, ShoppingCart, DollarSign, Eye, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function getPercentChange(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Get basic counts
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
  
  // Get this week's signups
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count: weeklySignups } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  // Get this week's orders
  const { count: weeklyOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [
    { count: previousWeeklySignups },
    { count: previousWeeklyOrders },
    { count: pageViews },
    { count: previousPageViews },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString()),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString()),
    (supabase as any)
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('created_at', oneWeekAgo.toISOString()),
    (supabase as any)
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString()),
    (supabase as any)
      .from('orders')
      .select('creator_id, product_id, amount')
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  const safePageViews = pageViews || 0;
  const safeOrders = totalOrders || 0;
  const conversionRate = safePageViews > 0 ? ((safeOrders / safePageViews) * 100).toFixed(2) : '0.00';

  const usersChange = getPercentChange(weeklySignups || 0, previousWeeklySignups || 0);
  const ordersChange = getPercentChange(weeklyOrders || 0, previousWeeklyOrders || 0);
  const pageViewsChange = getPercentChange(pageViews || 0, previousPageViews || 0);

  const orders = recentOrders || [];
  const creatorTotals = new Map<string, number>();
  const productSales = new Map<string, number>();
  const creatorIds = new Set<string>();
  const productIds = new Set<string>();

  for (const order of orders) {
    if (order.creator_id) {
      creatorIds.add(order.creator_id);
      creatorTotals.set(order.creator_id, (creatorTotals.get(order.creator_id) || 0) + (order.amount || 0));
    }

    if (order.product_id) {
      productIds.add(order.product_id);
      productSales.set(order.product_id, (productSales.get(order.product_id) || 0) + 1);
    }
  }

  const [{ data: creators }, { data: products }] = await Promise.all([
    creatorIds.size
      ? supabase.from('profiles').select('id, username').in('id', Array.from(creatorIds))
      : Promise.resolve({ data: [] as Array<{ id: string; username: string | null }> }),
    productIds.size
      ? supabase.from('products').select('id, title').in('id', Array.from(productIds))
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ]);

  const creatorNameMap = new Map((creators || []).map((creator) => [creator.id, creator.username || 'Unknown creator']));
  const productNameMap = new Map((products || []).map((product) => [product.id, product.title]));

  const topCreators = Array.from(creatorTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([creatorId, revenue], index) => ({
      rank: index + 1,
      name: creatorNameMap.get(creatorId) || 'Unknown creator',
      revenue,
    }));

  const topProducts = Array.from(productSales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, sales], index) => ({
      rank: index + 1,
      name: productNameMap.get(productId) || 'Unknown product',
      sales,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Analytics
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Track platform performance and growth metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/10">
              <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              {usersChange >= 0 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
              {Math.abs(usersChange).toFixed(1)}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{totalUsers || 0}</p>
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-1 text-xs text-gray-400">+{weeklySignups || 0} this week</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              {ordersChange >= 0 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
              {Math.abs(ordersChange).toFixed(1)}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{totalOrders || 0}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-1 text-xs text-gray-400">+{weeklyOrders || 0} this week</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/10">
              <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              {pageViewsChange >= 0 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
              {Math.abs(pageViewsChange).toFixed(1)}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{safePageViews.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Page Views</p>
          <p className="mt-1 text-xs text-gray-400">Last 7 days</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-gray-500">real-time</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="mt-1 text-xs text-gray-400">Visitor to purchase</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">User Growth Snapshot</h3>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">New users (7d)</span>
              <span className="font-medium text-gray-900 dark:text-white">{weeklySignups || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Previous 7d</span>
              <span className="font-medium text-gray-900 dark:text-white">{previousWeeklySignups || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Total users</span>
              <span className="font-medium text-gray-900 dark:text-white">{totalUsers || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Traffic Snapshot</h3>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Page views (7d)</span>
              <span className="font-medium text-gray-900 dark:text-white">{safePageViews.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Previous 7d</span>
              <span className="font-medium text-gray-900 dark:text-white">{(previousPageViews || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Conversion rate</span>
              <span className="font-medium text-gray-900 dark:text-white">{conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Top Creators</h3>
          <div className="space-y-4">
            {topCreators.map((creator) => (
              <div key={`${creator.rank}-${creator.name}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {creator.rank}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
                  <span className="text-gray-900 dark:text-white">{creator.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(creator.revenue / 100).toLocaleString()}
                </span>
              </div>
            ))}
            {topCreators.length === 0 && <p className="text-sm text-gray-500">No creator revenue data yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Top Products</h3>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={`${product.rank}-${product.name}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {product.rank}
                  </span>
                  <span className="text-gray-900 dark:text-white">{product.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {product.sales} sales
                </span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-gray-500">No product sales data yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { TrendingUp, Users, ShoppingCart, DollarSign, Eye, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

  // Get page views (placeholder for now)
  const pageViews = 12450;
  const conversionRate = 3.2;

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
              <ArrowUpRight className="mr-1 h-4 w-4" />
              12%
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
              <ArrowUpRight className="mr-1 h-4 w-4" />
              8%
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
              <ArrowUpRight className="mr-1 h-4 w-4" />
              23%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{pageViews.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Page Views</p>
          <p className="mt-1 text-xs text-gray-400">Last 7 days</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-red-600">
              <ArrowDownRight className="mr-1 h-4 w-4" />
              0.3%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="mt-1 text-xs text-gray-400">Visitor to purchase</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">User Growth</h3>
            <select className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-center text-gray-500">
              <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">Chart visualization</p>
              <p className="text-sm">Integrate charting library</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
            <select className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-center text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">Revenue chart</p>
              <p className="text-sm">Daily/weekly breakdown</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Top Creators</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {i}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
                  <span className="text-gray-900 dark:text-white">Creator {i}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(1000 - i * 150).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Top Products</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {i}
                  </span>
                  <span className="text-gray-900 dark:text-white">Product {i}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {100 - i * 15} sales
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

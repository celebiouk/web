import { createClient } from '@/lib/supabase/server';
import { DollarSign, TrendingUp, CreditCard, Percent } from 'lucide-react';

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  // Get revenue data
  const { data: orders } = await supabase
    .from('orders')
    .select('amount, status, created_at')
    .eq('status', 'completed') as unknown as { data: { amount: number; status: string; created_at: string }[] | null };

  const { data: commissions } = await supabase
    .from('commission_ledger')
    .select('amount, created_at') as unknown as { data: { amount: number; created_at: string }[] | null };

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('status', 'active') as unknown as { data: { plan: string; status: string }[] | null };

  const totalGMV = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const monthlyProCount = subscriptions?.filter(s => s.plan === 'pro_monthly').length || 0;
  const yearlyProCount = subscriptions?.filter(s => s.plan === 'pro_yearly').length || 0;
  const mrr = (monthlyProCount * 1999) + (yearlyProCount * 1399);

  // Monthly breakdown
  const monthlyData = orders?.reduce((acc, order) => {
    const month = new Date(order.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + (order.amount || 0);
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Revenue Dashboard
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Platform revenue and financial metrics
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Total GMV</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              ${(totalGMV / 100).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500 text-white">
              <Percent className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Commission Earned</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              ${(totalCommission / 100).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Monthly Recurring (MRR)</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              ${(mrr / 100).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Pro Subscribers</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {monthlyProCount + yearlyProCount}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Revenue Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(monthlyData).slice(0, 12).map(([month, amount]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{month}</span>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min((amount / totalGMV) * 100 * 5, 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-medium text-gray-900 dark:text-white">
                    ${(amount / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

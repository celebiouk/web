import { createClient } from '@/lib/supabase/server';
import { CreditCard, Crown, TrendingDown, Clock } from 'lucide-react';

type SubscriptionWithProfile = {
  id: string;
  status: string;
  plan: string;
  created_at: string;
  current_period_end: string | null;
  profiles: { full_name: string | null; username: string | null; email: string | null } | null;
};

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      profiles!subscriptions_user_id_fkey(full_name, username, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as { data: SubscriptionWithProfile[] | null };

  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const cancelledCount = subscriptions?.filter(s => s.status === 'cancelled').length || 0;
  const monthlyCount = subscriptions?.filter(s => s.plan === 'pro_monthly' && s.status === 'active').length || 0;
  const yearlyCount = subscriptions?.filter(s => s.plan === 'pro_yearly' && s.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Subscription Management
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage Pro subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Pro</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{monthlyCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Yearly</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{yearlyCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{cancelledCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Started</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Renews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {subscriptions?.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {sub.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">@{sub.profiles?.username}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                    <Crown className="h-3 w-3" />
                    {sub.plan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    sub.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(sub.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

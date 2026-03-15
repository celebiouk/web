import { createClient } from '@/lib/supabase/server';
import { Users, DollarSign, Link2, TrendingUp } from 'lucide-react';

type AffiliateWithProfile = {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  is_active: boolean;
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export default async function AdminAffiliatesPage() {
  const supabase = await createClient();

  const { data: affiliates } = await supabase
    .from('affiliates')
    .select(`
      *,
      profiles!affiliates_user_id_fkey(full_name, username, avatar_url)
    `)
    .order('total_earnings', { ascending: false })
    .limit(50) as unknown as { data: AffiliateWithProfile[] | null };

  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('amount, status')
    .eq('status', 'pending') as unknown as { data: { amount: number; status: string }[] | null };

  const totalAffiliates = affiliates?.length || 0;
  const totalReferrals = affiliates?.reduce((sum, a) => sum + (a.total_referrals || 0), 0) || 0;
  const totalEarnings = affiliates?.reduce((sum, a) => sum + (a.total_earnings || 0), 0) || 0;
  const pendingPayouts = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Affiliate Management
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage affiliate partners and commissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Affiliates</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalAffiliates}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Referrals</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalReferrals}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">${totalEarnings.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-white">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Payouts</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">${pendingPayouts.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Affiliate</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Referrals</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {affiliates?.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {affiliate.profiles?.avatar_url ? (
                      <img
                        src={affiliate.profiles.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                        <Users className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {affiliate.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">@{affiliate.profiles?.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
                    {affiliate.affiliate_code}
                  </code>
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {(affiliate.commission_rate * 100).toFixed(0)}%
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  {affiliate.total_referrals || 0}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  ${(affiliate.total_earnings || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    affiliate.is_active 
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    {affiliate.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

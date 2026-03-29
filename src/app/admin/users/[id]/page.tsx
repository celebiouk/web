import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { UserActionsPanel } from '@/components/admin/users/UserActionsPanel';
import { isInternalAdminEmail } from '@/lib/admin';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isInternalAdminEmail(user.email)) {
    notFound();
  }

  const adminSupabase = await createServiceClient();

  const { data: profile } = await (adminSupabase.from('profiles') as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const [{ count: productsCount }, { count: ordersCount }, { data: subscription }] = await Promise.all([
    (adminSupabase.from('products') as any)
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', id),
    (adminSupabase.from('orders') as any)
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', id),
    (adminSupabase.from('subscriptions') as any)
      .select('status, plan, current_period_end')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const isPro = profile.subscription_tier === 'pro' || subscription?.status === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage account status and plan access.</p>
        </div>
        <Link
          href="/admin/users"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to users
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">{profile.full_name?.[0] || '?'}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile.full_name || 'No name'}</h2>
              <p className="text-gray-500 dark:text-gray-400">{profile.username ? `@${profile.username}` : 'No username'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-sm text-gray-500">Current Tier</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{isPro ? 'Pro' : 'Free'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{profile.is_suspended ? 'Suspended' : 'Active'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-sm text-gray-500">Products</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{productsCount || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-sm text-gray-500">Orders</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{ordersCount || 0}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500">Joined</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">{new Date(profile.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <UserActionsPanel userId={profile.id} isSuspended={Boolean(profile.is_suspended)} isPro={Boolean(isPro)} />
        </div>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { AdminStatsCards } from '../../components/admin/AdminStatsCards';
import { AdminRecentActivity } from '../../components/admin/AdminRecentActivity';
import { AdminQuickActions } from '../../components/admin/AdminQuickActions';

// Type definitions for admin queries
type OrderWithProfile = {
  id: string;
  amount: number;
  created_at: string;
  profiles: { full_name: string | null; username: string | null } | null;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch platform stats
  const [
    { count: totalUsers },
    { count: totalCreators },
    { count: totalOrders },
    { count: totalProducts },
    { count: proSubscribers },
    { data: recentOrders },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('username', 'is', null),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('*, profiles!orders_creator_id_fkey(full_name, username)').order('created_at', { ascending: false }).limit(5) as unknown as { data: OrderWithProfile[] | null },
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5) as unknown as { data: UserProfile[] | null },
  ]);

  // Calculate revenue (sum of all orders)
  const { data: revenueData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'completed') as unknown as { data: { amount: number }[] | null };

  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

  // Calculate commission earned (8% of free tier sales)
  const { data: commissionData } = await supabase
    .from('commission_ledger')
    .select('amount') as unknown as { data: { amount: number }[] | null };

  const totalCommission = commissionData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

  const stats = {
    totalUsers: totalUsers || 0,
    totalCreators: totalCreators || 0,
    totalOrders: totalOrders || 0,
    totalProducts: totalProducts || 0,
    proSubscribers: proSubscribers || 0,
    totalRevenue,
    totalCommission,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Platform overview and management
        </p>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Quick Actions */}
      <AdminQuickActions />

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminRecentActivity
          title="Recent Orders"
          items={recentOrders?.map((order) => ({
            id: order.id,
            title: `$${(order.amount / 100).toFixed(2)} order`,
            subtitle: order.profiles?.full_name || 'Unknown creator',
            time: new Date(order.created_at).toLocaleDateString(),
            href: `/admin/orders?id=${order.id}`,
          })) || []}
        />
        <AdminRecentActivity
          title="New Users"
          items={recentUsers?.map((user) => ({
            id: user.id,
            title: user.full_name || user.username || 'New user',
            subtitle: user.username ? `@${user.username}` : 'No username',
            time: new Date(user.created_at).toLocaleDateString(),
            href: `/admin/users?id=${user.id}`,
          })) || []}
        />
      </div>
    </div>
  );
}

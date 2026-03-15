import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrdersFilters } from '@/components/admin/orders/OrdersFilters';
import { OrdersStats } from '@/components/admin/orders/OrdersStats';
import { Spinner } from '@/components/ui';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const status = typeof params.status === 'string' ? params.status : 'all';
  const dateRange = typeof params.dateRange === 'string' ? params.dateRange : 'all';
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const perPage = 20;

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_creator_id_fkey(full_name, username),
      products(title)
    `, { count: 'exact' });

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Apply date range filter
  if (dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0);
    }
    
    query = query.gte('created_at', startDate.toISOString());
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data: orders, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  // Get stats
  const { data: allOrders } = await supabase
    .from('orders')
    .select('amount, status') as unknown as { data: { amount: number; status: string }[] | null };

  const stats = {
    totalOrders: allOrders?.length || 0,
    completedOrders: allOrders?.filter(o => o.status === 'completed').length || 0,
    pendingOrders: allOrders?.filter(o => o.status === 'pending').length || 0,
    totalRevenue: allOrders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0) || 0,
  };

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Order Management
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          View and manage all platform orders
        </p>
      </div>

      {/* Stats */}
      <OrdersStats stats={stats} />

      {/* Filters */}
      <OrdersFilters status={status} dateRange={dateRange} />

      {/* Orders Table */}
      <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
        <OrdersTable
          orders={orders || []}
          currentPage={page}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}

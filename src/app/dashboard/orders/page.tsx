'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderStatus } from '@/types/supabase';

type OrderWithProduct = Order & {
  products: {
    title: string;
    price: number;
    currency: string;
  };
};

const STATUS_STYLES: Record<OrderStatus, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'error', label: 'Failed' },
  refunded: { variant: 'default', label: 'Refunded' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    platformFees: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            title,
            price,
            currency
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersData = (data || []) as OrderWithProduct[];
      setOrders(ordersData);

      // Calculate stats
      const completedOrders = ordersData.filter(o => o.status === 'completed');
      setStats({
        totalOrders: ordersData.length,
        completedOrders: completedOrders.length,
        totalRevenue: completedOrders.reduce((sum, o) => sum + o.net_amount_cents, 0),
        platformFees: completedOrders.reduce((sum, o) => sum + o.platform_fee_cents, 0),
      });

    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }

  function formatPrice(cents: number, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={loadOrders}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orders
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track your sales and revenue
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(stats.totalRevenue)}
            </p>
            <p className="text-xs text-gray-500">After fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Platform Fees
            </p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {formatPrice(stats.platformFees)}
            </p>
            <p className="text-xs text-gray-500">Total deducted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Orders
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalOrders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completed
            </p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {stats.completedOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <span className="text-3xl">📋</span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              No orders yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              When you make your first sale, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Buyer</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                    <th className="px-4 py-3 font-medium">Your Earnings</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-500">
                          {order.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {order.products.title}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {order.buyer_email}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {formatPrice(order.amount_cents, order.products.currency)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatPrice(order.platform_fee_cents, order.products.currency)}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-600">
                        {formatPrice(order.net_amount_cents, order.products.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_STYLES[order.status].variant}>
                          {STATUS_STYLES[order.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y md:hidden dark:divide-gray-700">
              {orders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.products.title}
                      </p>
                      <p className="text-sm text-gray-500">{order.buyer_email}</p>
                    </div>
                    <Badge variant={STATUS_STYLES[order.status].variant}>
                      {STATUS_STYLES[order.status].label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Amount: </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatPrice(order.amount_cents, order.products.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">You earn: </span>
                      <span className="font-medium text-green-600">
                        {formatPrice(order.net_amount_cents, order.products.currency)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    cele.bio commission: {formatPrice(order.platform_fee_cents, order.products.currency)}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

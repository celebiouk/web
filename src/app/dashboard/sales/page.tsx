'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderStatus } from '@/types/supabase';

type OrderWithProduct = Order & {
  products: {
    title: string;
    currency: string;
  };
};

type SubscriberRow = {
  id: string;
  email: string;
  first_name: string | null;
  name: string | null;
  created_at: string;
  is_active: boolean | null;
};

type SalesRow = {
  id: string;
  item: string;
  buyerName: string;
  buyerEmail: string;
  amountCents: number;
  currency: string;
  platformFeeCents: number;
  netAmountCents: number;
  status: OrderStatus | 'lead';
  createdAt: string;
};

const STATUS_STYLES: Record<SalesRow['status'], { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'error', label: 'Failed' },
  refunded: { variant: 'default', label: 'Refunded' },
  lead: { variant: 'default', label: 'Free Guide' },
};

function inferNameFromEmail(email: string): string {
  const local = (email || '').split('@')[0] || '';
  if (!local) return 'Customer';

  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function SalesPage() {
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    paidSales: 0,
    freeGuideLeads: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const [ordersRes, subscribersRes, profileRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            id,
            buyer_email,
            amount_cents,
            platform_fee_cents,
            net_amount_cents,
            status,
            created_at,
            products (
              title,
              currency
            )
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase.from('email_subscribers') as any)
          .select('id,email,first_name,name,created_at,is_active')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase.from('profiles') as any)
          .select('email_form_title')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (subscribersRes.error) throw subscribersRes.error;
      if (profileRes.error) throw profileRes.error;

      const orders = (ordersRes.data || []) as OrderWithProduct[];
      const subscribers = ((subscribersRes.data || []) as SubscriberRow[]).filter((row) => row.is_active !== false);
      const freeGuideTitle = profileRes.data?.email_form_title || 'Free Guide';

      const subscriberNameByEmail = new Map<string, string>();
      for (const subscriber of subscribers) {
        const displayName = subscriber.first_name || subscriber.name || '';
        if (displayName) {
          subscriberNameByEmail.set(subscriber.email.toLowerCase(), displayName);
        }
      }

      const orderRows: SalesRow[] = orders.map((order) => {
        const buyerEmail = order.buyer_email;
        const mappedName = subscriberNameByEmail.get(buyerEmail.toLowerCase());
        return {
          id: order.id,
          item: order.products?.title || 'Product',
          buyerName: mappedName || inferNameFromEmail(buyerEmail),
          buyerEmail,
          amountCents: order.amount_cents,
          currency: order.products?.currency || 'usd',
          platformFeeCents: order.platform_fee_cents,
          netAmountCents: order.net_amount_cents,
          status: order.status,
          createdAt: order.created_at,
        };
      });

      const leadRows: SalesRow[] = subscribers.map((subscriber) => ({
        id: `lead-${subscriber.id}`,
        item: freeGuideTitle,
        buyerName: subscriber.first_name || subscriber.name || inferNameFromEmail(subscriber.email),
        buyerEmail: subscriber.email,
        amountCents: 0,
        currency: 'usd',
        platformFeeCents: 0,
        netAmountCents: 0,
        status: 'lead',
        createdAt: subscriber.created_at,
      }));

      const merged = [...orderRows, ...leadRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSales(merged);

      const completedOrders = orderRows.filter((row) => row.status === 'completed');
      setStats({
        totalSales: merged.length,
        paidSales: completedOrders.length,
        freeGuideLeads: leadRows.length,
        totalRevenue: completedOrders.reduce((sum, row) => sum + row.netAmountCents, 0),
      });
    } catch (err) {
      console.error('Sales load error:', err);
      setError('Failed to load sales');
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
            <Button className="mt-4" onClick={loadSales}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Sales</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">See who bought and who claimed your free guide.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500">After fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid Orders</p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.paidSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Free Guide</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.freeGuideLeads}</p>
            <p className="text-xs text-gray-500">Shown as $0 sales</p>
          </CardContent>
        </Card>
      </div>

      {sales.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No sales yet</h2>
            <p className="text-gray-600 dark:text-gray-400">Your sales and free guide claims will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Buyer Name</th>
                    <th className="px-4 py-3 font-medium">Buyer Email</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{sale.item}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{sale.buyerName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{sale.buyerEmail}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {formatPrice(sale.amountCents, sale.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_STYLES[sale.status].variant}>{STATUS_STYLES[sale.status].label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(sale.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y md:hidden dark:divide-gray-700">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sale.item}</p>
                      <p className="text-sm text-gray-500">{sale.buyerName}</p>
                      <p className="text-sm text-gray-500">{sale.buyerEmail}</p>
                    </div>
                    <Badge variant={STATUS_STYLES[sale.status].variant}>{STATUS_STYLES[sale.status].label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    Amount: {formatPrice(sale.amountCents, sale.currency)}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">{formatDate(sale.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

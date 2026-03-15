'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Spinner, Button } from '@/components/ui';
import type { CommissionMonthlyTotal } from '@/types/supabase';

type CommissionMonthlyResponse = {
  rows: CommissionMonthlyTotal[];
  summary: {
    totalCommissionCents: number;
    totalSales: number;
  };
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatMonth(monthIso: string | null): string {
  if (!monthIso) {
    return 'N/A';
  }

  return new Date(monthIso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function CommissionMonthlyClient() {
  const [data, setData] = useState<CommissionMonthlyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCommissionMonthly();
  }, []);

  async function loadCommissionMonthly() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/commission-monthly', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have access to this report.');
        }
        throw new Error('Failed to load commission report.');
      }

      const json = (await response.json()) as CommissionMonthlyResponse;
      setData(json);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load commission report.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const averageCommission = useMemo(() => {
    if (!data || data.summary.totalSales === 0) {
      return 0;
    }

    return Math.round(data.summary.totalCommissionCents / data.summary.totalSales);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Commissions</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Internal platform commission reporting</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            <Button className="mt-4" onClick={() => void loadCommissionMonthly()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Commissions</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Internal platform commission reporting</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Commission</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(data?.summary.totalCommissionCents ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales Count</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.summary.totalSales ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Commission / Sale</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(averageCommission)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Month</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.rows.length ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-400">No commission data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Month</th>
                    <th className="px-4 py-3 font-medium">Sales Count</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {data.rows.map((row, index) => (
                    <tr key={row.month ?? `row-${index}`}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{formatMonth(row.month)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.sales_count ?? 0}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {formatPrice(row.total_commission_cents ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

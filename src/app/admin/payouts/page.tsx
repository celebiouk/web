'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

type ManualPayout = {
  id: string;
  creator_id: string;
  payout_date: string;
  period_start: string;
  period_end: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  paid_at?: string | null;
  paid_by_admin_email?: string | null;
  profiles?: {
    full_name?: string | null;
    username?: string | null;
  } | null;
};

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState<ManualPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch('/api/admin/manual-payouts/list', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load payouts');
      return;
    }
    setRows((json.payouts || []) as ManualPayout[]);
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function markPaid(payoutId: string) {
    setBusyId(payoutId);
    setError(null);
    try {
      const res = await fetch('/api/admin/manual-payouts/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to mark payout as paid');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark payout as paid');
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = rows.filter((row) => row.status === 'pending').length;
  const pendingAmount = rows
    .filter((row) => row.status === 'pending')
    .reduce((sum, row) => sum + Number(row.amount_cents || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manual Payout Queue</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Process manual payouts on the 9th and 24th. Creator processor fees are borne by the creator per policy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">Pending payouts</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-brand-300 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/20">
          <p className="text-sm text-brand-800 dark:text-brand-200">Pending amount</p>
          <p className="text-2xl font-bold text-brand-900 dark:text-brand-100">${(pendingAmount / 100).toFixed(2)}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading payouts...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No manual payouts queued yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Creator</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Period</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Payout date</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const creatorName = row.profiles?.full_name || row.profiles?.username || row.creator_id;
                  return (
                    <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{creatorName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.period_start} → {row.period_end}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.payout_date}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">${(Number(row.amount_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                            : row.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => markPaid(row.id)}
                            disabled={busyId === row.id}
                          >
                            {busyId === row.id ? 'Processing…' : 'Mark Paid'}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">{row.paid_at ? `Paid ${new Date(row.paid_at).toLocaleDateString()}` : '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

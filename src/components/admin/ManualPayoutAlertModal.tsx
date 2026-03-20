'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BellRing } from 'lucide-react';

type DueSummary = {
  count: number;
  totalAmountCents: number;
  payouts: Array<{
    id: string;
    creatorName: string;
    amountCents: number;
    payoutDate: string;
    daysUntil: number;
  }>;
};

export function ManualPayoutAlertModal() {
  const [summary, setSummary] = useState<DueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/api/admin/manual-payouts/due-summary', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setSummary(data);
      } catch {
        // ignore transient errors
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    const interval = setInterval(load, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || !summary || summary.count <= 0) return null;

  const urgentCount = summary.payouts.filter((payout) => payout.daysUntil <= 1).length;
  const total = (summary.totalAmountCents / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl animate-pulse rounded-2xl border-2 border-red-500 bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Manual payouts need action ({summary.count})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ${total} is queued for creators. {urgentCount > 0 ? `${urgentCount} payout(s) are due today/tomorrow.` : 'Payouts are due in the next 2 days.'}
            </p>
          </div>
        </div>

        <div className="max-h-56 space-y-2 overflow-auto rounded-xl bg-red-50 p-3 dark:bg-red-950/20">
          {summary.payouts.slice(0, 8).map((payout) => (
            <div key={payout.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-3 py-2 text-sm dark:border-red-900/40 dark:bg-gray-900">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{payout.creatorName}</p>
                <p className="text-gray-600 dark:text-gray-300">Due {payout.payoutDate}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-700 dark:text-red-300">${(payout.amountCents / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{payout.daysUntil <= 0 ? 'Due now' : `${payout.daysUntil} day(s) left`}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/payouts"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <BellRing className="h-4 w-4" />
            Open Payout Queue Now
          </Link>
          <p className="text-xs text-gray-500">
            This alert stays visible until due payouts are processed.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge } from '@/components/ui';

export type DashboardNudge = {
  type: 'first_sale' | 'third_sale' | 'fourth_product_attempt' | 'email_limit_warning';
  title: string;
  description: string;
  ctaLabel: string;
};

export function UpgradeNudgeBanner({ nudge }: { nudge: DashboardNudge }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);
      await fetch('/api/nudges/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeType: nudge.type }),
      });
      router.push(`/dashboard/settings/billing?upgrade=zeroCommission&nudge=${nudge.type}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-emerald-50 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-emerald-500/10">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="pro">PRO</Badge>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Upgrade tip</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{nudge.title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{nudge.description}</p>
          </div>
          <Button onClick={handleClick} isLoading={loading}>
            {nudge.ctaLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

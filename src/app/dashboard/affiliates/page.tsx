'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';

type Affiliate = {
  id: string;
  affiliate_name: string;
  affiliate_email: string;
  affiliate_code: string;
  commission_rate: number;
  status: 'pending' | 'approved' | 'rejected';
  total_referred_sales_cents: number;
  total_commission_earned_cents: number;
};

type Conversion = {
  id: string;
  affiliate_id: string;
  sale_amount_cents: number;
  commission_amount_cents: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
};

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [defaultRatePct, setDefaultRatePct] = useState(20);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const response = await fetch('/api/affiliates/manage');
    const json = await response.json();
    setAffiliates((json.affiliates || []) as Affiliate[]);
    setConversions((json.conversions || []) as Conversion[]);
    setEnabled(Boolean(json.settings?.affiliate_enabled));
    setDefaultRatePct(Number((json.settings?.affiliate_default_rate || 0.2) * 100));
  }

  const totals = useMemo(() => {
    const approved = affiliates.filter((item) => item.status === 'approved').length;
    const referredSales = conversions.reduce((sum, row) => sum + row.sale_amount_cents, 0);
    const commissionOwed = conversions.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + row.commission_amount_cents, 0);
    return { approved, referredSales, commissionOwed };
  }, [affiliates, conversions]);

  async function saveSettings() {
    await fetch('/api/affiliates/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'settings',
        affiliateEnabled: enabled,
        defaultRate: defaultRatePct / 100,
      }),
    });

    await loadData();
  }

  async function reviewAffiliate(id: string, action: 'approve' | 'reject') {
    await fetch('/api/affiliates/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: action, affiliateId: id }),
    });
    await loadData();
  }

  async function markPaid(conversionId: string) {
    await fetch('/api/affiliates/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mark_paid', conversionId }),
    });
    await loadData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Affiliates</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage applications, referred sales, and manual payouts.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Program Settings</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
            Enable affiliate program
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          </label>
          <Input type="number" value={defaultRatePct} onChange={(e) => setDefaultRatePct(Number(e.target.value || 20))} />
          <Button onClick={saveSettings}>Save</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Approved affiliates</p><p className="text-2xl font-bold">{totals.approved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Referred sales</p><p className="text-2xl font-bold">${(totals.referredSales / 100).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Commission owed</p><p className="text-2xl font-bold">${(totals.commissionOwed / 100).toFixed(2)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {affiliates.map((affiliate) => (
            <div key={affiliate.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{affiliate.affiliate_name}</p>
                <p className="text-sm text-gray-500">{affiliate.affiliate_email}</p>
                <p className="text-xs text-gray-500">Code: <span className="font-mono">{affiliate.affiliate_code}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={affiliate.status === 'approved' ? 'success' : affiliate.status === 'pending' ? 'warning' : affiliate.status === 'rejected' ? 'error' : 'default'}>
                  {affiliate.status}
                </Badge>
                {affiliate.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => void reviewAffiliate(affiliate.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => void reviewAffiliate(affiliate.id, 'reject')}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Conversions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {conversions.map((conversion) => (
            <div key={conversion.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
              <div>
                <p>Sale ${(conversion.sale_amount_cents / 100).toFixed(2)} • Commission ${(conversion.commission_amount_cents / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{new Date(conversion.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={conversion.status === 'paid' ? 'success' : conversion.status === 'approved' ? 'pro' : 'warning'}>
                  {conversion.status}
                </Badge>
                {conversion.status !== 'paid' ? (
                  <Button size="sm" variant="outline" onClick={() => void markPaid(conversion.id)}>Mark as Paid</Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

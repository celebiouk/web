'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui';

export function DomainSettingsClient({
  username,
  currentDomain,
  verified,
}: {
  username: string;
  currentDomain: string | null;
  verified: boolean;
}) {
  const [domain, setDomain] = useState(currentDomain || '');
  const [status, setStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>(verified ? 'verified' : currentDomain ? 'pending' : 'idle');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verifyDomain() {
    try {
      setLoading(true);
      setMessage(null);
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');
      setStatus(data.status === 'verified' ? 'verified' : 'pending');
      setMessage(data.status === 'verified'
        ? `Success — ${data.domain} is verified and ready to use.`
        : 'DNS records were not fully detected yet. Save the records below, wait a few minutes, and verify again.');
    } catch (error) {
      console.error(error);
      setStatus('failed');
      setMessage('We could not verify your DNS yet. Double-check the records below and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect your domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Enter your custom domain</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="johndoe.com" />
              <Button onClick={verifyDomain} isLoading={loading} disabled={!domain.trim()}>Verify Domain</Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={status === 'verified' ? 'success' : status === 'failed' ? 'error' : 'warning'}>
              {status === 'verified' ? 'Verified' : status === 'failed' ? 'Failed' : status === 'pending' ? 'Pending' : 'Not started'}
            </Badge>
            {currentDomain ? <span className="text-sm text-gray-500 dark:text-gray-400">Current domain: {currentDomain}</span> : null}
          </div>

          {message ? <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DNS instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/60">
            <p className="font-semibold text-gray-900 dark:text-white">1. Add a CNAME record</p>
            <p className="mt-1">Host: <strong>www</strong> → Value: <strong>cname.cele.bio</strong></p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/60">
            <p className="font-semibold text-gray-900 dark:text-white">2. Add an A record</p>
            <p className="mt-1">Host: <strong>@</strong> → Value: <strong>76.76.21.21</strong></p>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-500/10">
            <p className="font-semibold text-gray-900 dark:text-white">3. What happens after verification?</p>
            <p className="mt-1">Once verified, visitors can reach your storefront at your custom domain instead of cele.bio/{username}.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Button, Input } from '@/components/ui';

export default function AffiliateApplyPage() {
  const params = useParams();
  const username = params.username as string;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const response = await fetch('/api/affiliates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        affiliate_name: name,
        affiliate_email: email,
        promotion_plan: plan,
      }),
    });

    if (!response.ok) {
      const json = await response.json();
      setError(json.error || 'Unable to submit application');
      return;
    }

    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-xl px-4">
        <Card>
          <CardContent className="space-y-4 p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apply as an Affiliate</h1>
            <p className="text-gray-600 dark:text-gray-400">Partner with @{username} and earn commissions for referred sales.</p>

            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                Application submitted. You will get approved/rejected by email.
              </div>
            ) : (
              <>
                <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <textarea
                  rows={5}
                  placeholder="How will you promote this?"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
                />
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <Button onClick={submit} disabled={!name || !email}>Submit Application</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

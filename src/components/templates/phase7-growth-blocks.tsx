'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import type { CreatorPageData } from '@/types/creator-page';

export function Phase7GrowthBlocks({ data }: { data: CreatorPageData }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;

    setStatus('loading');

    const response = await fetch('/api/email/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: data.profile.id,
        email,
        firstName,
        source: 'storefront',
      }),
    });

    setStatus(response.ok ? 'success' : 'error');

    if (response.ok) {
      setEmail('');
      setFirstName('');
    }
  }

  const bundles = data.bundles || [];
  const students = data.social_proof?.total_students || 0;
  const productCount = data.social_proof?.product_count || data.products.length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-center gap-6 p-4 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{students.toLocaleString()} students</span>
          <span className="text-gray-400">•</span>
          <span className="font-semibold text-gray-900 dark:text-white">{productCount} products</span>
          <span className="text-gray-400">•</span>
          <span className="font-semibold text-gray-900 dark:text-white">New offers every month</span>
        </CardContent>
      </Card>

      {bundles.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Bundles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {bundles.map((bundle) => {
              const savings = bundle.original_value_cents - bundle.price_cents;
              const savingsPct = bundle.original_value_cents > 0 ? Math.round((savings / bundle.original_value_cents) * 100) : 0;
              const cover = bundle.cover_image_url || data.products[0]?.cover_image_url || null;

              return (
                <Card key={bundle.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="relative h-44 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      {cover ? (
                        <Image src={cover} alt={bundle.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl">📦</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{bundle.title}</h3>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {bundle.products.slice(0, 4).map((product) => (
                        <li key={product.id}>• {product.title}</li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 line-through">${(bundle.original_value_cents / 100).toFixed(2)}</span>
                      <span className="text-xl font-bold text-brand-600 dark:text-brand-400">${(bundle.price_cents / 100).toFixed(2)}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Save {savingsPct}%</span>
                    </div>
                    <Link href={`/checkout/bundle/${bundle.id}`}>
                      <Button className="w-full">Get Bundle</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.email_form?.title || 'Get my free guide'}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{data.email_form?.description || 'Join my list for updates, tips, and offers.'}</p>

          <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={submitEmail}>
            <input
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <input
              type="email"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Joining...' : 'Join free'}</Button>
          </form>

          {status === 'success' ? <p className="mt-3 text-sm text-emerald-600">You’re in. Check your inbox.</p> : null}
          {status === 'error' ? <p className="mt-3 text-sm text-red-500">Could not subscribe right now. Try again.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

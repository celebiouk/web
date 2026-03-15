'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Spinner } from '@/components/ui';

type Bundle = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  original_value_cents: number;
  is_published: boolean;
  show_on_storefront: boolean;
};

type BundleProductRow = {
  bundle_id: string;
  product_id: string;
  products?: {
    id: string;
    title: string;
    price: number;
    type: string;
  };
};

export default function BundlesPage() {
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundleProducts, setBundleProducts] = useState<BundleProductRow[]>([]);

  useEffect(() => {
    void loadBundles();
  }, []);

  async function loadBundles() {
    setLoading(true);
    const response = await fetch('/api/bundles', { cache: 'no-store' });
    const json = await response.json();
    setBundles((json.bundles || []) as Bundle[]);
    setBundleProducts((json.bundleProducts || []) as BundleProductRow[]);
    setLoading(false);
  }

  async function togglePublish(bundle: Bundle) {
    await fetch(`/api/bundles/${bundle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !bundle.is_published }),
    });
    await loadBundles();
  }

  const productCountByBundle = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of bundleProducts) {
      map.set(row.bundle_id, (map.get(row.bundle_id) || 0) + 1);
    }
    return map;
  }, [bundleProducts]);

  if (loading) {
    return <div className="flex min-h-[320px] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bundle Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">Package multiple products together at a discounted price.</p>
        </div>
        <Link href="/dashboard/products/bundles/new"><Button>New Bundle</Button></Link>
      </div>

      {bundles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No bundles yet</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Create your first bundle to increase average order value.</p>
            <Link href="/dashboard/products/bundles/new" className="mt-4 inline-block"><Button>Create Bundle</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bundles.map((bundle) => {
            const savings = bundle.original_value_cents - bundle.price_cents;
            const savingsPct = bundle.original_value_cents > 0 ? Math.round((savings / bundle.original_value_cents) * 100) : 0;

            return (
              <Card key={bundle.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{bundle.title}</CardTitle>
                  <Badge variant={bundle.is_published ? 'success' : 'default'}>{bundle.is_published ? 'Published' : 'Draft'}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{bundle.description || 'No description'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Included products: {productCountByBundle.get(bundle.id) || 0}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 line-through">${(bundle.original_value_cents / 100).toFixed(2)}</span>
                    <span className="text-2xl font-bold text-brand-600">${(bundle.price_cents / 100).toFixed(2)}</span>
                    <Badge variant="warning">Save {savingsPct}%</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => void togglePublish(bundle)}>
                      {bundle.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Link href={`/checkout/bundle/${bundle.id}`}><Button variant="outline" size="sm">Preview Checkout</Button></Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

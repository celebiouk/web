'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

type ProductOption = {
  id: string;
  title: string;
  price: number;
  type: string;
  is_published: boolean;
};

export default function NewBundlePage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [priceCents, setPriceCents] = useState(0);
  const [showOnStorefront, setShowOnStorefront] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('id,title,price,type,is_published')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    setProducts((data || []) as ProductOption[]);
  }

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  );

  const totalValue = useMemo(
    () => selectedProducts.reduce((sum, product) => sum + product.price, 0),
    [selectedProducts]
  );

  const suggestedPrice = Math.floor(totalValue * 0.7);
  const savings = Math.max(0, totalValue - priceCents);
  const savingsPct = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

  async function createBundle() {
    if (!title || selectedProductIds.length < 2) return;
    setSaving(true);

    const response = await fetch('/api/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        cover_image_url: coverImageUrl || undefined,
        price_cents: priceCents,
        product_ids: selectedProductIds,
        is_published: isPublished,
        show_on_storefront: showOnStorefront,
      }),
    });

    setSaving(false);

    if (response.ok) {
      router.push('/dashboard/products/bundles');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Bundle</h1>
        <p className="text-gray-600 dark:text-gray-400">Create a high-converting bundle in four steps.</p>
      </div>

      <div className="flex gap-2 text-sm text-gray-500">
        {[1, 2, 3, 4].map((s) => (
          <button key={s} className={`rounded-full px-3 py-1 ${step === s ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' : 'bg-gray-100 dark:bg-gray-800'}`} onClick={() => setStep(s)}>
            Step {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Step 1 — Bundle Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Bundle name" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              rows={4}
              placeholder="Bundle description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input placeholder="Cover image URL (optional)" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
            <div className="flex justify-end"><Button onClick={() => setStep(2)}>Next</Button></div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Step 2 — Add Products</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {products.length === 0 ? (
              <div className="text-sm text-gray-500">No published products available.</div>
            ) : (
              products.map((product) => (
                <label key={product.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.title}</p>
                    <p className="text-gray-500">${(product.price / 100).toFixed(2)} · {product.type}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={(e) => setSelectedProductIds((prev) => e.target.checked ? [...prev, product.id] : prev.filter((id) => id !== product.id))}
                  />
                </label>
              ))
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">Individual value: ${(totalValue / 100).toFixed(2)}</p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={selectedProductIds.length < 2}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Step 3 — Set Price</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-700">
              Suggested price (70%): ${(suggestedPrice / 100).toFixed(2)}
            </div>
            <Input
              type="number"
              placeholder="Bundle price in USD"
              value={priceCents ? (priceCents / 100).toString() : ''}
              onChange={(e) => setPriceCents(Math.round(Number(e.target.value || 0) * 100))}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Save ${(savings / 100).toFixed(2)} ({savingsPct}% off)</p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={priceCents <= 0 || priceCents >= totalValue}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Step 4 — Publish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
              Show on storefront
              <input type="checkbox" checked={showOnStorefront} onChange={(e) => setShowOnStorefront(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
              Publish now
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            </label>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">{title || 'Bundle name'}</p>
              <p className="text-sm text-gray-500">{selectedProductIds.length} products included</p>
              <p className="mt-2 text-xl font-bold text-brand-600">${(priceCents / 100).toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={createBundle} disabled={saving}>{saving ? 'Creating...' : 'Create Bundle'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!products.length && (
        <div className="text-center text-sm text-amber-600 dark:text-amber-400">You need at least two published products to create a bundle.</div>
      )}
    </div>
  );
}

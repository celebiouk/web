'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function UpsellPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [upsell, setUpsell] = useState<any>(null);

  useEffect(() => {
    void loadOrderUpsell();
  }, [orderId]);

  async function loadOrderUpsell() {
    const { data } = await (supabase.from('orders') as any)
      .select('id,buyer_email,product_id,status,products(id,title,price,creator_id,upsell_enabled,upsell_product_id,upsell_price_cents)')
      .eq('id', orderId)
      .single();

    if (!data) {
      router.replace('/checkout/success');
      return;
    }

    setOrder(data);

    if (!data.products?.upsell_enabled || !data.products?.upsell_product_id) {
      router.replace(`/checkout/success?orderId=${orderId}`);
      return;
    }

    const { data: upsellProduct } = await (supabase.from('products') as any)
      .select('id,title,description,price')
      .eq('id', data.products.upsell_product_id)
      .single();

    if (!upsellProduct) {
      router.replace(`/checkout/success?orderId=${orderId}`);
      return;
    }

    setUpsell({
      ...upsellProduct,
      upsell_price_cents: data.products.upsell_price_cents || upsellProduct.price,
    });
    setLoading(false);
  }

  async function acceptUpsell() {
    if (!upsell || !order) return;
    setSubmitting(true);

    const response = await fetch('/api/checkout/upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalOrderId: order.id,
        upsellProductId: upsell.id,
        buyerEmail: order.buyer_email,
      }),
    });

    const json = await response.json();

    if (response.ok) {
      router.replace(`/checkout/success?orderId=${order.id}${json.orderId ? `&upsellOrderId=${json.orderId}` : ''}`);
      return;
    }

    setSubmitting(false);
  }

  if (loading || !upsell) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>;
  }

  const regularPrice = upsell.price;
  const upsellPrice = upsell.upsell_price_cents;
  const savings = Math.max(0, regularPrice - upsellPrice);

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-amber-600">Special one-time offer</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add this to your order</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{upsell.title}</p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-lg text-gray-500 line-through">${(regularPrice / 100).toFixed(2)}</span>
              <span className="text-4xl font-bold text-brand-600">${(upsellPrice / 100).toFixed(2)}</span>
            </div>
            <p className="mt-1 text-sm text-emerald-600">You save ${(savings / 100).toFixed(2)}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={acceptUpsell} disabled={submitting}>
                {submitting ? 'Adding...' : 'Yes, add to my order'}
              </Button>
              <Link href={`/checkout/success?orderId=${order.id}`}>
                <Button variant="outline">No thanks, continue</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

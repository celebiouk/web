'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Card, CardContent, Button, Input, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BundleCheckoutPage() {
  const params = useParams();
  const bundleId = params.bundleId as string;
  const supabase = createClient();

  const [bundle, setBundle] = useState<any>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadBundle();
  }, [bundleId]);

  async function loadBundle() {
    const { data } = await (supabase.from('bundles') as any)
      .select('id,title,description,price_cents,original_value_cents,is_published')
      .eq('id', bundleId)
      .eq('is_published', true)
      .single();
    setBundle(data || null);
    setLoading(false);
  }

  async function startPayment() {
    const response = await fetch('/api/checkout/bundle/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundleId, buyerEmail }),
    });

    const json = await response.json();
    if (response.ok) {
      setClientSecret(json.clientSecret);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (!bundle) return <div className="p-8 text-center">Bundle not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bundle.title}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{bundle.description}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-lg text-gray-500 line-through">${(bundle.original_value_cents / 100).toFixed(2)}</span>
              <span className="text-3xl font-bold text-brand-600">${(bundle.price_cents / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {!clientSecret ? (
              <div className="space-y-3">
                <Input placeholder="Email" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                <Button onClick={startPayment} disabled={!buyerEmail}>Continue to payment</Button>
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <BundlePaymentForm />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BundlePaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setSubmitting(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?bundle=true`,
      },
      redirect: 'if_required',
    });

    if (!error) {
      router.push('/checkout/success?bundle=true');
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={submitting || !stripe}>Pay Bundle</Button>
    </form>
  );
}

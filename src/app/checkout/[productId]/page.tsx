'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent, Button, Input, Spinner, RichTextContent } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics/track';
import type { Product, Profile } from '@/types/supabase';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/**
 * Checkout page for purchasing a product
 */
export default function CheckoutPage() {
  const params = useParams();
  const productId = params.productId as string;
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_published', true)
        .single();

      if (productError || !productData) {
        setError('Product not found');
        return;
      }

      const product = productData as Product;

      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', product.creator_id)
        .single();

      setProduct(product);
      setCreator(creatorData as Profile | null);

      if (product.creator_id) {
        const params = new URLSearchParams(window.location.search);
        void trackEvent({
          type: 'checkout_started',
          creator_id: product.creator_id,
          product_id: product.id,
          utm_source: params.get('utm_source') || undefined,
          utm_medium: params.get('utm_medium') || undefined,
          utm_campaign: params.get('utm_campaign') || undefined,
        });
      }
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  }

  async function createPaymentIntent() {
    if (!buyerEmail.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsCreatingPayment(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          buyerEmail: buyerEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Handle free products
      if (data.free) {
        router.push(`/checkout/upsell/${data.orderId}`);
        return;
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setIsCreatingPayment(false);
    }
  }

  function formatPrice(priceInCents: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceInCents / 100);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <span className="text-4xl">😕</span>
            <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {error}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This product may have been removed or is no longer available.
            </p>
            <Link href="/">
              <Button className="mt-6">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Complete your purchase
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Product Summary */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardContent className="p-4">
              <div className="flex gap-4">
                {product.cover_image_url ? (
                  <Image
                    src={product.cover_image_url}
                    alt={product.title}
                    width={80}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-gray-100 text-2xl dark:bg-gray-800">
                    📁
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {product.title}
                  </h2>
                  {creator && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {creator.full_name || creator.username || 'Creator'}
                    </p>
                  )}
                  <p className="mt-2 text-lg font-bold text-brand-600 dark:text-brand-400">
                    {product.price === 0
                      ? 'Free'
                      : formatPrice(product.price, product.currency)}
                  </p>
                </div>
              </div>
              </CardContent>
            </Card>

            {((product as any).description_html || product.description) ? (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    What You&apos;ll Get
                  </h3>
                  {(product as any).description_html ? (
                    <RichTextContent html={(product as any).description_html} className="text-sm" />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{product.description}</p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Payment Form */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              {!clientSecret ? (
                // Email Step
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Enter your email
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We&apos;ll send your download link to this email
                  </p>

                  <Input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isCreatingPayment}
                  />

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  <Button
                    onClick={createPaymentIntent}
                    disabled={isCreatingPayment || !buyerEmail.trim()}
                    className="w-full"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : product.price === 0 ? (
                      'Get Free Download'
                    ) : (
                      `Pay ${formatPrice(product.price, product.currency)}`
                    )}
                  </Button>
                </div>
              ) : (
                // Payment Step
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#6366f1',
                      },
                    },
                  }}
                >
                  <PaymentForm
                    orderId={orderId}
                    amount={product.price}
                    currency={product.currency}
                  />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          🔒 Secure checkout powered by Stripe
        </p>
      </div>
    </div>
  );
}

/**
 * Payment Form Component
 */
function PaymentForm({
  orderId,
  amount,
  currency,
}: {
  orderId: string | null;
  amount: number;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/upsell/${orderId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setIsProcessing(false);
    }
    // If successful, user is redirected to return_url
  }

  function formatPrice(priceInCents: number, curr: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(priceInCents / 100);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(amount, currency)}`
        )}
      </Button>
    </form>
  );
}

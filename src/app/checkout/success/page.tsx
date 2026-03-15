'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

/**
 * Checkout Success Page
 * Shows download link after successful payment
 */
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentIntentStatus = searchParams.get('redirect_status');

  const [order, setOrder] = useState<{
    id: string;
    status: string;
    product_title: string;
    buyer_email: string;
    amount_cents: number;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (orderId) {
      loadOrder();
    } else {
      setError('No order found');
      setIsLoading(false);
    }
  }, [orderId]);

  async function loadOrder() {
    if (!orderId) return;
    
    try {
      // Get order with product info
      const { data, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          buyer_email,
          amount_cents,
          products (
            title
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !data) {
        // Order might still be processing
        if (paymentIntentStatus === 'succeeded') {
          // Wait a moment and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return loadOrder();
        }
        throw orderError || new Error('Order not found');
      }

      const orderData = data as {
        id: string;
        status: string;
        buyer_email: string;
        amount_cents: number;
        products: { title: string };
      };
      
      setOrder({
        id: orderData.id,
        status: orderData.status,
        product_title: orderData.products.title,
        buyer_email: orderData.buyer_email,
        amount_cents: orderData.amount_cents,
      });

    } catch (err) {
      console.error('Load order error:', err);
      setError('Failed to load order');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload() {
    if (!orderId) return;

    setIsDownloading(true);
    setError(null);

    try {
      const res = await fetch(`/api/download/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Download failed');
      }

      setDownloadUrl(data.downloadUrl);

      // Auto-trigger download
      window.open(data.downloadUrl, '_blank');

    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Processing your order...
          </p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <span className="text-4xl">❌</span>
            <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <Link href="/">
              <Button className="mt-6">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  const isPending = order.status === 'pending';
  const isCompleted = order.status === 'completed';
  const isFree = order.amount_cents === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-lg px-4">
        <Card>
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
              <span className="text-4xl">✓</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isPending ? 'Processing Payment...' : 'Thank You!'}
            </h1>

            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isPending
                ? 'Your payment is being processed. This may take a moment.'
                : isFree
                  ? 'Your download is ready!'
                  : 'Your purchase was successful!'}
            </p>

            {/* Order Summary */}
            <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">
                {order.product_title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Confirmation sent to {order.buyer_email}
              </p>
            </div>

            {/* Download Section */}
            {isCompleted && (
              <div className="mt-6 space-y-4">
                {downloadUrl ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your download started automatically. If not, click below:
                    </p>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-brand-600 underline dark:text-brand-400"
                    >
                      Download Again
                    </a>
                    <p className="mt-2 text-xs text-gray-500">
                      Link expires in 1 hour
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full"
                  >
                    {isDownloading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Preparing Download...
                      </>
                    ) : (
                      '📥 Download Your File'
                    )}
                  </Button>
                )}

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
            )}

            {/* Pending Message */}
            {isPending && (
              <div className="mt-6">
                <Spinner size="md" />
                <p className="mt-4 text-sm text-gray-500">
                  We&apos;ll send your download link via email once payment is confirmed.
                </p>
              </div>
            )}

            {/* Help Text */}
            <p className="mt-8 text-sm text-gray-500">
              Questions? Contact the creator or check your email for support info.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

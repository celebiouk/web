'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Booking, Profile, Product } from '@/types/supabase';

interface CancelDetails {
  booking: Booking;
  creator: Profile;
  product: Product;
}

function CancelBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<CancelDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    if (!token) {
      setError('Invalid cancel link');
      setLoading(false);
      return;
    }
    loadBooking();
  }, [token]);

  async function loadBooking() {
    if (!token) return;
    
    const supabase = createClient();
    
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_creator_id_fkey (*),
        products (*)
      `)
      .eq('cancellation_token', token)
      .single();

    if (bookingError || !bookingData) {
      setError('Booking not found or link has expired');
      setLoading(false);
      return;
    }

    // Type assertion since Supabase doesn't know our joined types
    const booking = bookingData as unknown as Booking & { 
      profiles: Profile; 
      products: Product;
    };

    if (booking.status.startsWith('cancelled')) {
      setError('This booking has already been cancelled');
      setLoading(false);
      return;
    }

    if (new Date(booking.scheduled_at) < new Date()) {
      setError('Cannot cancel past bookings');
      setLoading(false);
      return;
    }

    setDetails({
      booking: booking,
      creator: booking.profiles,
      product: booking.products,
    });
    setLoading(false);
  }

  async function handleCancel() {
    if (!token) return;
    
    setCancelling(true);
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelToken: token,
          cancelledBy: 'buyer',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel');
      }

      setRefundAmount(result.refundAmount || 0);
      setCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Unable to Cancel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Booking Cancelled
            </h1>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Your booking has been cancelled successfully.
            </p>
            {refundAmount > 0 && (
              <p className="mb-4 text-emerald-600">
                A refund of ${(refundAmount / 100).toFixed(2)} will be processed within 5-10 business days.
              </p>
            )}
            <p className="text-sm text-gray-500">
              A confirmation email has been sent.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) return null;

  const { booking, creator, product } = details;
  const scheduledAt = new Date(booking.scheduled_at);
  const hoursUntil = (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Cancel Booking?
            </h1>
          </div>

          {/* Booking Details */}
          <div className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {product?.title || 'Coaching Call'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              with {creator?.full_name || creator?.username}
            </p>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                📅 {scheduledAt.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p>
                🕐 {scheduledAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} ({booking.duration_minutes} min)
              </p>
            </div>
          </div>

          {/* Refund Policy Notice */}
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-500/10">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {hoursUntil >= 24 ? (
                <>
                  <strong>Full refund:</strong> You&apos;re cancelling more than 24 hours before your session.
                </>
              ) : (
                <>
                  <strong>Partial refund (50%):</strong> You&apos;re cancelling less than 24 hours before your session.
                </>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleCancel}
              isLoading={cancelling}
            >
              Cancel Booking
            </Button>
          </div>

          {/* Reschedule Option */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Need a different time?{' '}
              <Link
                href={`/book/reschedule?token=${booking.reschedule_token}`}
                className="text-brand-600 hover:underline"
              >
                Reschedule instead
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CancelBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    }>
      <CancelBookingContent />
    </Suspense>
  );
}

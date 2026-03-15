'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { formatTimeForDisplay, generateICSFile, TIMEZONE_OPTIONS } from '@/lib/utils/generateAvailableSlots';
import type { Booking, Product, Profile } from '@/types/supabase';
import Confetti from 'react-confetti';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const paymentIntentId = searchParams.get('payment_intent');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    // Get window size for confetti
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function loadBooking() {
      if (!paymentIntentId && !bookingId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Find booking by payment intent ID or booking ID
      let query = supabase
        .from('bookings')
        .select('*');

      if (paymentIntentId) {
        query = query.eq('stripe_payment_intent_id', paymentIntentId);
      } else if (bookingId) {
        query = query.eq('id', bookingId);
      }

      const { data: bookingData, error } = await query.single();

      if (error || !bookingData) {
        console.error('Booking not found:', error);
        setLoading(false);
        return;
      }

      const typedBooking = bookingData as unknown as Booking;
      setBooking(typedBooking);

      // Load product and creator
      if (typedBooking.product_id) {
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', typedBooking.product_id)
          .single();
        
        if (productData) {
          setProduct(productData as unknown as Product);
        }
      }

      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', typedBooking.creator_id)
        .single();

      if (creatorData) {
        setCreator(creatorData as unknown as Profile);
      }

      // Trigger confirmation emails via API
      try {
        await fetch('/api/bookings/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: typedBooking.id }),
        });
      } catch (err) {
        console.error('Failed to send confirmation emails:', err);
      }

      setLoading(false);
    }

    loadBooking();
  }, [paymentIntentId, bookingId]);

  const handleAddToCalendar = (type: 'google' | 'apple' | 'outlook') => {
    if (!booking || !product || !creator) return;

    const scheduledAt = new Date(booking.scheduled_at);
    const endTime = new Date(scheduledAt.getTime() + booking.duration_minutes * 60000);

    if (type === 'google') {
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${product.title} with ${creator.full_name || creator.username}`,
        dates: `${formatGoogleDate(scheduledAt)}/${formatGoogleDate(endTime)}`,
        details: `Video call: ${booking.video_call_url}`,
        location: booking.video_call_url || '',
      });
      window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
    } else {
      // Download ICS file for Apple/Outlook
      const icsContent = generateICSFile({
        title: `${product.title} with ${creator.full_name || creator.username}`,
        description: `Video call link: ${booking.video_call_url}`,
        location: booking.video_call_url || '',
        startTime: scheduledAt,
        durationMinutes: booking.duration_minutes,
        organizerName: creator.full_name || creator.username || 'Creator',
        organizerEmail: 'noreply@cele.bio',
        attendeeName: booking.buyer_name,
        attendeeEmail: booking.buyer_email,
      });

      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'booking.ics';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  function formatGoogleDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!booking || !creator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-6xl">🤔</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Booking Not Found
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            We couldn&apos;t find this booking. Please check your email for confirmation.
          </p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const scheduledAt = new Date(booking.scheduled_at);
  const tzLabel = TIMEZONE_OPTIONS.find(t => t.value === booking.timezone)?.label || booking.timezone;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']}
        />
      )}

      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            You&apos;re Booked!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A confirmation email has been sent to {booking.buyer_email}
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-6 flex items-start gap-4">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.full_name || creator.username || ''}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600 dark:bg-brand-500/20">
                  {(creator.full_name || creator.username || 'C')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {product?.title || 'Coaching Call'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  with {creator.full_name || creator.username}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
                  📅
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {scheduledAt.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {scheduledAt.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })} · {booking.duration_minutes} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
                  🌍
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {tzLabel}
                </p>
              </div>
            </div>

            {/* Video Call Button */}
            {booking.video_call_url && (
              <div className="mt-6">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => window.open(booking.video_call_url!, '_blank')}
                >
                  <span className="mr-2">🎥</span>
                  Join Video Call
                </Button>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Save this link! You&apos;ll need it to join the call.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add to Calendar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Add to Calendar
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleAddToCalendar('google')}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <span className="text-2xl">📆</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Google</span>
              </button>
              <button
                onClick={() => handleAddToCalendar('apple')}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <span className="text-2xl">🍎</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Apple</span>
              </button>
              <button
                onClick={() => handleAddToCalendar('outlook')}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <span className="text-2xl">📧</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Outlook</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Check out more products */}
        <div className="text-center">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            While you wait, check out more from {creator.full_name || creator.username}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/${creator.username}`)}
          >
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}

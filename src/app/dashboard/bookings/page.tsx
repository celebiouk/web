'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Badge, Textarea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { formatTimeForDisplay, TIMEZONE_OPTIONS } from '@/lib/utils/generateAvailableSlots';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import type { Booking, Product, AvailabilitySchedule } from '@/types/supabase';

type TabType = 'upcoming' | 'past' | 'cancelled';

interface BookingWithProduct extends Booking {
  product?: Product;
}

export default function BookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingWithProduct[]>([]);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [stats, setStats] = useState({
    totalCallsThisMonth: 0,
    revenueThisMonth: 0,
    upcomingThisWeek: 0,
  });

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if creator has availability set up
    const { data: scheduleData } = await supabase
      .from('availability_schedules')
      .select('id')
      .eq('creator_id', user.id)
      .single();

    setHasSchedule(!!scheduleData);

    // Load all bookings
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        products (*)
      `)
      .eq('creator_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error loading bookings:', error);
    }

    if (bookingsData) {
      const typedBookings = (bookingsData as unknown as Array<Booking & { products: Product }>).map(b => ({
        ...b,
        product: b.products as unknown as Product,
      })) as BookingWithProduct[];
      setBookings(typedBookings);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const completedThisMonth = typedBookings.filter(b => 
        b.status === 'completed' &&
        new Date(b.scheduled_at) >= startOfMonth
      );

      const upcomingThisWeek = typedBookings.filter(b => 
        b.status === 'confirmed' &&
        new Date(b.scheduled_at) >= now &&
        new Date(b.scheduled_at) <= endOfWeek
      );

      setStats({
        totalCallsThisMonth: completedThisMonth.length,
        revenueThisMonth: completedThisMonth.reduce((sum, b) => sum + b.net_amount_cents, 0),
        upcomingThisWeek: upcomingThisWeek.length,
      });
    }

    setLoading(false);
  }

  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const scheduledAt = new Date(booking.scheduled_at);
    
    switch (activeTab) {
      case 'upcoming':
        return booking.status === 'confirmed' && scheduledAt > now;
      case 'past':
        return (booking.status === 'completed' || 
          (booking.status === 'confirmed' && scheduledAt < now));
      case 'cancelled':
        return booking.status.startsWith('cancelled');
      default:
        return true;
    }
  });

  // Find next upcoming booking
  const nextBooking = bookings.find(b => 
    b.status === 'confirmed' && new Date(b.scheduled_at) > new Date()
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bookings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your 1:1 coaching sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bookings/availability">
            <Button variant="outline">
              Set Availability
            </Button>
          </Link>
          <Link href="/dashboard/bookings/settings">
            <Button variant="outline">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Setup CTA if no schedule */}
      {!hasSchedule && (
        <Card className="border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
                <Calendar className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Set Up Your Availability
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Define when you&apos;re available for coaching calls
                </p>
              </div>
              <Link href="/dashboard/bookings/availability">
                <Button>Get Started</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Calls This Month
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalCallsThisMonth}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Revenue This Month
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              ${(stats.revenueThisMonth / 100).toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upcoming This Week
            </p>
            <p className="mt-1 text-2xl font-bold text-brand-600">
              {stats.upcomingThisWeek}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Booking Highlight */}
      {nextBooking && (
        <NextBookingCard booking={nextBooking} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {(['upcoming', 'past', 'cancelled'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              {activeTab === 'upcoming' ? (
                <Calendar className="h-8 w-8 text-gray-400" />
              ) : activeTab === 'past' ? (
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              ) : (
                <XCircle className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              No {activeTab} bookings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'upcoming' 
                ? 'When someone books a call with you, it will appear here.'
                : activeTab === 'past'
                ? 'Your completed sessions will appear here.'
                : 'No cancelled bookings.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onRefresh={loadBookings}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Next Booking Highlight Card
function NextBookingCard({ booking }: { booking: BookingWithProduct }) {
  const scheduledAt = new Date(booking.scheduled_at);
  const now = new Date();
  const diffMs = scheduledAt.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const isWithin15Mins = diffMins <= 15 && diffMins > 0;
  const isLive = diffMins <= 0 && diffMins > -booking.duration_minutes;

  return (
    <Card className={isLive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : ''}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {isLive ? 'HAPPENING NOW' : 'NEXT UP'}
              </p>
              {isWithin15Mins && !isLive && (
                <span className="animate-pulse rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Starting soon
                </span>
              )}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {booking.buyer_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {booking.product?.title || 'Coaching Call'} · {booking.duration_minutes} min
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {scheduledAt.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })} at {scheduledAt.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
          {booking.video_call_url && (
            <Button
              onClick={() => window.open(booking.video_call_url!, '_blank')}
              className={isWithin15Mins || isLive ? 'animate-pulse' : ''}
            >
              {isLive ? 'Join Now' : 'Join Call'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Booking Card
function BookingCard({ 
  booking, 
  onRefresh 
}: { 
  booking: BookingWithProduct;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(booking.creator_notes || '');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const scheduledAt = new Date(booking.scheduled_at);
  const isPast = scheduledAt < new Date();
  const isCancelled = booking.status.startsWith('cancelled');

  const handleSaveNotes = async () => {
    setSaving(true);
    const supabase = createClient();
    
    await (supabase
      .from('bookings') as any)
      .update({ creator_notes: notes })
      .eq('id', booking.id);

    setSaving(false);
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking? A full refund will be issued.')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          cancelledBy: 'creator',
          reason: 'Schedule conflict',
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-600 dark:bg-brand-500/20">
              {booking.buyer_name[0].toUpperCase()}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {booking.buyer_name}
                </h3>
                <Badge variant={isCancelled ? 'error' : isPast ? 'default' : 'success'}>
                  {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {booking.product?.title || 'Coaching Call'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {scheduledAt.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })} at {scheduledAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} · {booking.duration_minutes} min
              </p>
              {booking.buyer_notes && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  &ldquo;{booking.buyer_notes.slice(0, 100)}
                  {booking.buyer_notes.length > 100 ? '...' : ''}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCancelled && (
              <span className="font-semibold text-emerald-600">
                ${(booking.net_amount_cents / 100).toFixed(0)}
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Email</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {booking.buyer_email}
                </p>
              </div>
              {booking.buyer_phone && (
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {booking.buyer_phone}
                  </p>
                </div>
              )}
              {booking.video_call_url && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase text-gray-500">Video Call</p>
                  <a 
                    href={booking.video_call_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:underline"
                  >
                    {booking.video_call_url}
                  </a>
                </div>
              )}
            </div>

            {/* Creator Notes */}
            {isPast && !isCancelled && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                  Your Notes (private)
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this session..."
                  rows={2}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    isLoading={saving}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            {!isPast && !isCancelled && (
              <div className="mt-4 flex gap-2">
                {booking.video_call_url && (
                  <Button
                    size="sm"
                    onClick={() => window.open(booking.video_call_url!, '_blank')}
                  >
                    Join Call
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleCancel}
                  isLoading={cancelling}
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

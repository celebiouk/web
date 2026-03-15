'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { 
  getAvailableDates, 
  generateAvailableSlots,
  type TimeSlot
} from '@/lib/utils/generateAvailableSlots';
import type { Booking, Profile, Product, AvailabilitySchedule, WeeklySchedule } from '@/types/supabase';

interface RescheduleDetails {
  booking: Booking;
  creator: Profile;
  product: Product;
  schedule: AvailabilitySchedule;
}

function RescheduleBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<RescheduleDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduled, setRescheduled] = useState(false);
  const [newDateTime, setNewDateTime] = useState<string | null>(null);
  
  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reschedule link');
      setLoading(false);
      return;
    }
    loadBooking();
  }, [token]);

  useEffect(() => {
    if (selectedDate && details) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, details]);

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
      .eq('reschedule_token', token)
      .single();

    if (bookingError || !bookingData) {
      setError('Booking not found or link has expired');
      setLoading(false);
      return;
    }

    // Type assertion for the joined query
    const booking = bookingData as unknown as Booking & {
      profiles: Profile;
      products: Product;
    };

    if (booking.status !== 'confirmed') {
      setError('This booking cannot be rescheduled');
      setLoading(false);
      return;
    }

    if (new Date(booking.scheduled_at) < new Date()) {
      setError('Cannot reschedule past bookings');
      setLoading(false);
      return;
    }

    // Get availability schedule
    const { data: schedule } = await supabase
      .from('availability_schedules')
      .select('*')
      .eq('creator_id', booking.creator_id)
      .single();

    if (!schedule) {
      setError('Creator availability not set up');
      setLoading(false);
      return;
    }

    // Get existing bookings for conflict checking
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes, status')
      .eq('creator_id', booking.creator_id)
      .eq('status', 'confirmed')
      .neq('id', booking.id) // Exclude current booking
      .gte('scheduled_at', new Date().toISOString());

    // Get blocked dates
    const { data: blockedDatesData } = await supabase
      .from('blocked_dates')
      .select('blocked_date')
      .eq('creator_id', booking.creator_id)
      .gte('blocked_date', new Date().toISOString().split('T')[0]);

    const scheduleTyped = schedule as unknown as AvailabilitySchedule;
    const blockedDatesList = (blockedDatesData || []).map((d: { blocked_date: string }) => d.blocked_date);

    // Calculate available dates
    const dates = getAvailableDates(
      {
        weeklySchedule: scheduleTyped.weekly_schedule as WeeklySchedule,
        blockedDates: blockedDatesList,
        existingBookings: (existingBookings as unknown as Array<{ scheduled_at: string; duration_minutes: number; status: string }> || []).map(b => ({
          scheduled_at: b.scheduled_at,
          duration_minutes: b.duration_minutes,
          status: b.status,
        })),
        durationMinutes: booking.duration_minutes || 60,
        bufferMinutes: scheduleTyped.buffer_minutes || 15,
        minNoticeHours: scheduleTyped.min_notice_hours || 4,
        maxBookingsPerDay: scheduleTyped.max_bookings_per_day || 10,
        creatorTimezone: scheduleTyped.timezone,
      },
      30 // Look 30 days ahead
    );

    setAvailableDates(dates);
    setDetails({
      booking: booking as unknown as Booking,
      creator: booking.profiles as unknown as Profile,
      product: booking.products as unknown as Product,
      schedule: scheduleTyped,
    });
    setLoading(false);
  }

  async function loadSlots(date: Date) {
    if (!details) return;
    
    setSlotsLoading(true);
    setSelectedSlot(null);
    
    const supabase = createClient();
    
    // Get bookings for this date
    const dateStr = date.toISOString().split('T')[0];
    const { data: dayBookings } = await supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes')
      .eq('creator_id', details.booking.creator_id)
      .eq('status', 'confirmed')
      .neq('id', details.booking.id)
      .gte('scheduled_at', `${dateStr}T00:00:00`)
      .lt('scheduled_at', `${dateStr}T23:59:59`);

    const slots = generateAvailableSlots({
      date,
      weeklySchedule: details.schedule.weekly_schedule as WeeklySchedule,
      blockedDates: [],
      existingBookings: (dayBookings as unknown as Array<{ scheduled_at: string; duration_minutes: number }> || []).map(b => ({
        scheduled_at: b.scheduled_at,
        duration_minutes: b.duration_minutes,
        status: 'confirmed',
      })),
      durationMinutes: details.booking.duration_minutes || 60,
      bufferMinutes: details.schedule.buffer_minutes || 15,
      minNoticeHours: details.schedule.min_notice_hours || 4,
      maxBookingsPerDay: details.schedule.max_bookings_per_day || 10,
      creatorTimezone: details.schedule.timezone,
    });

    setAvailableSlots(slots.filter(s => s.available));
    setSlotsLoading(false);
  }

  async function handleReschedule() {
    if (!selectedSlot || !token) return;
    
    setRescheduling(true);
    try {
      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rescheduleToken: token,
          newDateTime: selectedSlot.datetime.toISOString(),
          rescheduledBy: 'buyer',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule');
      }

      setNewDateTime(result.newDateTime);
      setRescheduled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule booking');
    } finally {
      setRescheduling(false);
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
              Unable to Reschedule
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (rescheduled && newDateTime) {
    const newDate = new Date(newDateTime);
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Booking Rescheduled
            </h1>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Your session has been moved to:
            </p>
            <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10">
              <p className="font-semibold text-brand-700 dark:text-brand-300">
                {newDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-brand-600 dark:text-brand-400">
                {newDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Updated confirmation emails have been sent.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) return null;

  const { booking, creator, product } = details;
  const currentDate = new Date(booking.scheduled_at);

  // Group dates by month for the calendar
  const datesByMonth = availableDates.reduce((acc, date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(date);
    return acc;
  }, {} as Record<string, Date[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardContent className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Reschedule Your Session
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {product?.title} with {creator?.full_name || creator?.username}
              </p>
            </div>

            {/* Current Booking */}
            <div className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
              <p className="text-xs font-medium uppercase text-gray-500">Currently Scheduled</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })} at {currentDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="mb-3 font-medium text-gray-900 dark:text-white">
                Select New Date
              </h3>
              
              {Object.entries(datesByMonth).map(([key, dates]) => {
                const [year, month] = key.split('-').map(Number);
                const monthName = new Date(year, month).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                });
                
                return (
                  <div key={key} className="mb-4">
                    <p className="mb-2 text-sm font-medium text-gray-500">{monthName}</p>
                    <div className="flex flex-wrap gap-2">
                      {dates.map(date => {
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-brand-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                          >
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'short',
                              day: 'numeric' 
                            })}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="mb-6">
                <h3 className="mb-3 font-medium text-gray-900 dark:text-white">
                  Select Time
                </h3>
                
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No available times for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map(slot => {
                      const isSelected = selectedSlot?.datetime.getTime() === slot.datetime.getTime();
                      return (
                        <button
                          key={slot.datetime.toISOString()}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link href={`/book/cancel?token=${booking.cancellation_token}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel Instead
                </Button>
              </Link>
              <Button
                className="flex-1"
                onClick={handleReschedule}
                disabled={!selectedSlot}
                isLoading={rescheduling}
              >
                Confirm Reschedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RescheduleBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    }>
      <RescheduleBookingContent />
    </Suspense>
  );
}

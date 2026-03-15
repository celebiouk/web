'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { 
  formatDateToString, 
  formatTimeForDisplay,
  getBrowserTimezone,
  TIMEZONE_OPTIONS,
} from '@/lib/utils/generateAvailableSlots';
import type { 
  Profile, 
  Product, 
  AvailabilitySchedule,
  IntakeQuestion,
} from '@/types/supabase';

// Stripe promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BookingPageProps {
  params: Promise<{
    username: string;
    productId: string;
  }>;
}

interface AvailableSlot {
  time: string;
  datetime: string;
  available: boolean;
}

interface BookingData {
  selectedDate: Date | null;
  selectedTime: string | null;
  name: string;
  email: string;
  phone: string;
  notes: string;
  intakeAnswers: Record<string, string>;
}

export default function BookingPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [schedule, setSchedule] = useState<AvailabilitySchedule | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [buyerTimezone, setBuyerTimezone] = useState(getBrowserTimezone());
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [booking, setBooking] = useState<BookingData>({
    selectedDate: null,
    selectedTime: null,
    name: '',
    email: '',
    phone: '',
    notes: '',
    intakeAnswers: {},
  });

  // Current month for calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Get creator profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', resolvedParams.username)
        .single();

      if (!profileData) {
        setError('Creator not found');
        setLoading(false);
        return;
      }
      const profile = profileData as unknown as Profile;
      setCreator(profile);

      // Get product
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', resolvedParams.productId)
        .eq('type', 'coaching')
        .eq('is_published', true)
        .single();

      if (!productData) {
        setError('Product not found');
        setLoading(false);
        return;
      }
      setProduct(productData as unknown as Product);

      // Get availability schedule
      const { data: scheduleData } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('creator_id', profile.id)
        .single();

      if (scheduleData) {
        setSchedule(scheduleData as unknown as AvailabilitySchedule);
      }

      // Get blocked dates
      const { data: blockedData } = await supabase
        .from('blocked_dates')
        .select('blocked_date')
        .eq('creator_id', profile.id);

      if (blockedData) {
        setBlockedDates((blockedData as Array<{ blocked_date: string }>).map(d => d.blocked_date));
      }

      setLoading(false);
    }

    loadData();
  }, [resolvedParams.username, resolvedParams.productId]);

  // Load available slots when date is selected
  useEffect(() => {
    if (!booking.selectedDate || !creator || !product) return;

    async function loadSlots() {
      setSlotsLoading(true);
      try {
        const response = await fetch('/api/bookings/available-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: creator!.id,
            date: formatDateToString(booking.selectedDate!),
            durationMinutes: (product!.metadata as { duration_minutes?: number })?.duration_minutes || 60,
            buyerTimezone,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    }

    loadSlots();
  }, [booking.selectedDate, creator, product, buyerTimezone]);

  // Create payment intent when moving to step 4
  useEffect(() => {
    if (step !== 4 || clientSecret || !creator || !product) return;

    async function createPaymentIntent() {
      try {
        const response = await fetch('/api/bookings/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product!.id,
            creatorId: creator!.id,
            scheduledAt: new Date(
              `${formatDateToString(booking.selectedDate!)}T${booking.selectedTime}:00`
            ).toISOString(),
            durationMinutes: (product!.metadata as { duration_minutes?: number })?.duration_minutes || 60,
            buyerName: booking.name,
            buyerEmail: booking.email,
            buyerPhone: booking.phone || null,
            buyerNotes: booking.notes || null,
            buyerTimezone,
            intakeAnswers: booking.intakeAnswers,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment setup failed');
      }
    }

    createPaymentIntent();
  }, [step, clientSecret, creator, product, booking, buyerTimezone]);

  const canProceedToStep2 = booking.selectedDate !== null;
  const canProceedToStep3 = booking.selectedTime !== null;
  const canProceedToStep4 = Boolean(booking.name) && Boolean(booking.email) && validateEmail(booking.email);

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !creator || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-6xl">😕</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {error || 'Something went wrong'}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            This booking link may be invalid or expired.
          </p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-6xl">📅</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Booking Not Available Yet
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {creator.full_name || creator.username} hasn&apos;t set up their availability yet.
          </p>
          <Button onClick={() => router.push(`/${creator.username}`)}>
            View Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    s === step
                      ? 'bg-brand-600 text-white'
                      : s < step
                      ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 w-12 sm:w-20 ${
                      s < step
                        ? 'bg-brand-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Date</span>
            <span>Time</span>
            <span>Details</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Product Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {product.cover_image_url && (
                <img
                  src={product.cover_image_url}
                  alt={product.title}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {product.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  with {creator.full_name || creator.username}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-medium text-brand-600">
                    ${(product.price / 100).toFixed(0)}
                  </span>
                  <span className="text-gray-500">
                    {' · '}
                    {(product.metadata as { duration_minutes?: number })?.duration_minutes || 60} min
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Pick a Date */}
        {step === 1 && (
          <Step1DatePicker
            schedule={schedule}
            blockedDates={blockedDates}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={booking.selectedDate}
            onSelectDate={(date) => setBooking({ ...booking, selectedDate: date, selectedTime: null })}
            buyerTimezone={buyerTimezone}
            setBuyerTimezone={setBuyerTimezone}
            onContinue={() => setStep(2)}
            canContinue={canProceedToStep2}
          />
        )}

        {/* Step 2: Pick a Time */}
        {step === 2 && (
          <Step2TimePicker
            selectedDate={booking.selectedDate!}
            selectedTime={booking.selectedTime}
            availableSlots={availableSlots}
            slotsLoading={slotsLoading}
            buyerTimezone={buyerTimezone}
            onSelectTime={(time) => setBooking({ ...booking, selectedTime: time })}
            onContinue={() => setStep(3)}
            canContinue={canProceedToStep3}
          />
        )}

        {/* Step 3: Your Details */}
        {step === 3 && (
          <Step3Details
            booking={booking}
            setBooking={setBooking}
            intakeQuestions={schedule.intake_questions || []}
            onContinue={() => setStep(4)}
            canContinue={canProceedToStep4}
          />
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <Step4Payment
            clientSecret={clientSecret}
            booking={booking}
            product={product}
            creator={creator}
            buyerTimezone={buyerTimezone}
          />
        )}
      </main>
    </div>
  );
}

// Step 1: Date Picker Component
function Step1DatePicker({
  schedule,
  blockedDates,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  onSelectDate,
  buyerTimezone,
  setBuyerTimezone,
  onContinue,
  canContinue,
}: {
  schedule: AvailabilitySchedule;
  blockedDates: string[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  buyerTimezone: string;
  setBuyerTimezone: (tz: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateAvailable = (date: Date): boolean => {
    // Check if date is in the past
    if (date < today) return false;

    // Check if date is more than 60 days ahead
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    if (date > maxDate) return false;

    // Check if day is enabled in schedule
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const daySchedule = schedule.weekly_schedule[dayNames[date.getDay()]];
    if (!daySchedule?.enabled) return false;

    // Check if date is blocked
    const dateStr = formatDateToString(date);
    if (blockedDates.includes(dateStr)) return false;

    return true;
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select a Date
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose a day that works for you
        </p>
      </div>

      {/* Timezone Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">🌍</span>
        <select
          value={buyerTimezone}
          onChange={(e) => setBuyerTimezone(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          {TIMEZONE_OPTIONS.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
                  setCurrentMonth(prev);
                }
              }}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                const maxMonth = new Date(today);
                maxMonth.setMonth(maxMonth.getMonth() + 2);
                if (next <= maxMonth) {
                  setCurrentMonth(next);
                }
              }}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="py-3" />;
              }

              const isAvailable = isDateAvailable(date);
              const isSelected = selectedDate && formatDateToString(date) === formatDateToString(selectedDate);
              const isToday = formatDateToString(date) === formatDateToString(today);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => isAvailable && onSelectDate(date)}
                  disabled={!isAvailable}
                  className={`
                    relative rounded-xl py-3 text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-brand-600 text-white'
                      : isAvailable
                        ? 'bg-white hover:bg-brand-50 text-gray-900 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                        : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                    }
                    ${isToday && !isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button
        fullWidth
        size="lg"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Continue to Select Time
      </Button>
    </div>
  );
}

// Step 2: Time Picker Component
function Step2TimePicker({
  selectedDate,
  selectedTime,
  availableSlots,
  slotsLoading,
  buyerTimezone,
  onSelectTime,
  onContinue,
  canContinue,
}: {
  selectedDate: Date;
  selectedTime: string | null;
  availableSlots: AvailableSlot[];
  slotsLoading: boolean;
  buyerTimezone: string;
  onSelectTime: (time: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  const availableTimes = availableSlots.filter(s => s.available);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select a Time
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          {slotsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
          ) : availableTimes.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No available times for this date. Please select another day.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {availableTimes.map(slot => (
                <button
                  key={slot.time}
                  onClick={() => onSelectTime(slot.time)}
                  className={`
                    rounded-xl px-3 py-3 text-sm font-medium transition-all
                    ${selectedTime === slot.time
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {formatTimeForDisplay(slot.time)}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-gray-500">
        Times shown in {TIMEZONE_OPTIONS.find(t => t.value === buyerTimezone)?.label || buyerTimezone}
      </p>

      <Button
        fullWidth
        size="lg"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Continue to Your Details
      </Button>
    </div>
  );
}

// Step 3: Details Form
function Step3Details({
  booking,
  setBooking,
  intakeQuestions,
  onContinue,
  canContinue,
}: {
  booking: BookingData;
  setBooking: (booking: BookingData) => void;
  intakeQuestions: IntakeQuestion[];
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Details
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tell us a bit about yourself
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Input
            label="Full Name *"
            placeholder="John Doe"
            value={booking.name}
            onChange={(e) => setBooking({ ...booking, name: e.target.value })}
          />

          <Input
            label="Email *"
            type="email"
            placeholder="john@example.com"
            value={booking.email}
            onChange={(e) => setBooking({ ...booking, email: e.target.value })}
            hint="Confirmation and video link will be sent here"
          />

          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={booking.phone}
            onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
          />

          <Textarea
            label="What would you like to discuss? (optional)"
            placeholder="Share any topics or goals for our call..."
            value={booking.notes}
            onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
            rows={3}
          />

          {/* Custom Intake Questions */}
          {intakeQuestions.map(question => (
            <Textarea
              key={question.id}
              label={question.question + (question.required ? ' *' : '')}
              value={booking.intakeAnswers[question.id] || ''}
              onChange={(e) => setBooking({
                ...booking,
                intakeAnswers: {
                  ...booking.intakeAnswers,
                  [question.id]: e.target.value,
                },
              })}
              rows={2}
            />
          ))}
        </CardContent>
      </Card>

      <Button
        fullWidth
        size="lg"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Continue to Payment
      </Button>
    </div>
  );
}

// Step 4: Payment
function Step4Payment({
  clientSecret,
  booking,
  product,
  creator,
  buyerTimezone,
}: {
  clientSecret: string | null;
  booking: BookingData;
  product: Product;
  creator: Profile;
  buyerTimezone: string;
}) {
  if (!clientSecret) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Complete Your Booking
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and pay to confirm
        </p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 font-medium text-gray-900 dark:text-white">Booking Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {booking.selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTimeForDisplay(booking.selectedTime!)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duration</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {(product.metadata as { duration_minutes?: number })?.duration_minutes || 60} minutes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Timezone</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {TIMEZONE_OPTIONS.find(t => t.value === buyerTimezone)?.label || buyerTimezone}
              </span>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <div className="flex justify-between text-base">
              <span className="font-medium text-gray-900 dark:text-white">Total</span>
              <span className="font-bold text-brand-600">
                ${(product.price / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Payment Form */}
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#6366f1',
              borderRadius: '12px',
            },
          },
        }}
      >
        <PaymentForm 
          booking={booking} 
          product={product}
          creator={creator}
        />
      </Elements>
    </div>
  );
}

// Payment Form Component
function PaymentForm({
  booking,
  product,
  creator,
}: {
  booking: BookingData;
  product: Product;
  creator: Profile;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/success`,
        receipt_email: booking.email,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      // Payment successful - redirect to success page
      router.push(`/book/success?payment_intent=${paymentIntent.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <PaymentElement />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={processing}
        disabled={!stripe || !elements}
      >
        Confirm & Pay ${(product.price / 100).toFixed(2)}
      </Button>

      <p className="text-center text-xs text-gray-500">
        By booking, you agree to the cancellation policy.
        Your payment is secure and encrypted.
      </p>
    </form>
  );
}

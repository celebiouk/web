'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { WeeklySchedule, DaySchedule, AvailabilitySchedule } from '@/types/supabase';
import { 
  DEFAULT_WEEKLY_SCHEDULE, 
  TIMEZONE_OPTIONS,
  getBrowserTimezone,
  formatDateToString 
} from '@/lib/utils/generateAvailableSlots';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const BUFFER_OPTIONS = [
  { value: 0, label: 'No buffer' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
];

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [hasExistingSchedule, setHasExistingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing availability
  useEffect(() => {
    async function loadAvailability() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Load schedule
      const { data: scheduleData } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('creator_id', user.id)
        .single();

      if (scheduleData) {
        const typedData = scheduleData as unknown as AvailabilitySchedule;
        setSchedule(typedData.weekly_schedule);
        setTimezone(typedData.timezone);
        setBufferMinutes(typedData.buffer_minutes);
        setHasExistingSchedule(true);
      }

      // Load blocked dates
      const { data: blockedData } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('creator_id', user.id)
        .order('blocked_date', { ascending: true });

      if (blockedData) {
        setBlockedDates(blockedData as BlockedDate[]);
      }

      setLoading(false);
    }

    loadAvailability();
  }, [router]);

  const updateDaySchedule = (day: keyof WeeklySchedule, updates: Partial<DaySchedule>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      if (hasExistingSchedule) {
        const { error: updateError } = await (supabase
          .from('availability_schedules') as any)
          .update({
            weekly_schedule: schedule as unknown as Record<string, unknown>,
            timezone,
            buffer_minutes: bufferMinutes,
          })
          .eq('creator_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await (supabase
          .from('availability_schedules') as any)
          .insert({
            creator_id: user.id,
            weekly_schedule: schedule as unknown as Record<string, unknown>,
            timezone,
            buffer_minutes: bufferMinutes,
          });

        if (insertError) throw insertError;
        setHasExistingSchedule(true);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await (supabase
        .from('blocked_dates') as any)
        .insert({
          creator_id: user.id,
          blocked_date: newBlockedDate,
          reason: newBlockedReason || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setBlockedDates(prev => [...prev, data as BlockedDate].sort((a, b) => 
        a.blocked_date.localeCompare(b.blocked_date)
      ));
      setNewBlockedDate('');
      setNewBlockedReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add blocked date');
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      const supabase = createClient();
      
      const { error: deleteError } = await (supabase
        .from('blocked_dates') as any)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setBlockedDates(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove date');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Availability
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Set your weekly schedule and blocked dates
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/bookings')}>
          ← Back to Bookings
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-success-50 p-4 text-success-600 dark:bg-success-500/10 dark:text-success-400">
          Availability saved successfully!
        </div>
      )}

      {/* Timezone & Buffer Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            General Settings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {TIMEZONE_OPTIONS.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Buffer Between Calls
              </label>
              <select
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {BUFFER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Weekly Schedule
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Set the hours you&apos;re available for calls each day
          </p>
          
          <div className="space-y-4">
            {DAYS.map(({ key, label }) => (
              <DayScheduleRow
                key={key}
                day={key}
                label={label}
                schedule={schedule[key]}
                onChange={(updates) => updateDaySchedule(key, updates)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Blocked Dates
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Mark specific dates as unavailable (holidays, vacations, etc.)
          </p>

          {/* Add new blocked date */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px]">
              <Input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                min={formatDateToString(new Date())}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Reason (optional)"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
              />
            </div>
            <Button onClick={handleAddBlockedDate} disabled={!newBlockedDate}>
              Add Date
            </Button>
          </div>

          {/* List of blocked dates */}
          {blockedDates.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No blocked dates set
            </p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((date) => (
                <div
                  key={date.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(date.blocked_date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {date.reason && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        — {date.reason}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveBlockedDate(date.id)}
                    className="text-error-500 hover:text-error-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} size="lg">
          Save Availability
        </Button>
      </div>
    </div>
  );
}

// Day Schedule Row Component
function DayScheduleRow({
  day,
  label,
  schedule,
  onChange,
}: {
  day: string;
  label: string;
  schedule: DaySchedule;
  onChange: (updates: Partial<DaySchedule>) => void;
}) {
  const [showBreak, setShowBreak] = useState(!!schedule.break_start);

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-4">
        {/* Day Toggle */}
        <label className="flex w-32 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className={`font-medium ${schedule.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            {label}
          </span>
        </label>

        {schedule.enabled && (
          <>
            {/* Start Time */}
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={schedule.start}
                onChange={(e) => onChange({ start: e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={schedule.end}
                onChange={(e) => onChange({ end: e.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Break Toggle */}
            <button
              type="button"
              onClick={() => {
                if (showBreak) {
                  onChange({ break_start: null, break_end: null });
                }
                setShowBreak(!showBreak);
              }}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              {showBreak ? '- Remove break' : '+ Add break'}
            </button>
          </>
        )}
      </div>

      {/* Break Times */}
      {schedule.enabled && showBreak && (
        <div className="mt-3 flex items-center gap-2 pl-[140px]">
          <span className="text-sm text-gray-500">Break:</span>
          <input
            type="time"
            value={schedule.break_start || '12:00'}
            onChange={(e) => onChange({ break_start: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <span className="text-gray-500">to</span>
          <input
            type="time"
            value={schedule.break_end || '13:00'}
            onChange={(e) => onChange({ break_end: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { CancellationPolicy, VideoPlatform, IntakeQuestion, AvailabilitySchedule } from '@/types/supabase';

const CANCELLATION_POLICIES = [
  { value: 'full_refund', label: 'Full Refund', description: 'Always refund when buyer cancels' },
  { value: 'no_refund', label: 'No Refund', description: 'No refunds for cancellations' },
  { value: 'refund_if_24hrs', label: 'Refund if 24hrs+', description: 'Refund only if cancelled 24+ hours before' },
] as const;

const VIDEO_PLATFORMS = [
  { value: 'whereby', label: 'Whereby', description: 'Auto-generate Whereby room (recommended)' },
  { value: 'zoom', label: 'Zoom', description: 'Use your own Zoom meeting link' },
  { value: 'google_meet', label: 'Google Meet', description: 'Use your own Google Meet link' },
  { value: 'custom', label: 'Custom URL', description: 'Use a custom video call link' },
] as const;

const NOTICE_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
];

const MAX_BOOKINGS_OPTIONS = [
  { value: 1, label: '1 call' },
  { value: 2, label: '2 calls' },
  { value: 3, label: '3 calls' },
  { value: 5, label: '5 calls' },
  { value: 10, label: '10 calls' },
];

export default function BookingSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Settings state
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('refund_if_24hrs');
  const [minNoticeHours, setMinNoticeHours] = useState(4);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(10);
  const [customConfirmationMessage, setCustomConfirmationMessage] = useState('');
  const [videoPlatform, setVideoPlatform] = useState<VideoPlatform>('whereby');
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [intakeQuestions, setIntakeQuestions] = useState<IntakeQuestion[]>([]);
  const [hasSchedule, setHasSchedule] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('creator_id', user.id)
        .single();

      if (data) {
        const typedData = data as unknown as AvailabilitySchedule;
        setCancellationPolicy(typedData.cancellation_policy);
        setMinNoticeHours(typedData.min_notice_hours);
        setMaxBookingsPerDay(typedData.max_bookings_per_day);
        setCustomConfirmationMessage(typedData.custom_confirmation_message || '');
        setVideoPlatform(typedData.video_platform);
        setCustomVideoUrl(typedData.custom_video_url || '');
        setIntakeQuestions(typedData.intake_questions || []);
        setHasSchedule(true);
      }

      setLoading(false);
    }

    loadSettings();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const updates = {
        cancellation_policy: cancellationPolicy,
        min_notice_hours: minNoticeHours,
        max_bookings_per_day: maxBookingsPerDay,
        custom_confirmation_message: customConfirmationMessage || null,
        video_platform: videoPlatform,
        custom_video_url: videoPlatform !== 'whereby' ? customVideoUrl : null,
        intake_questions: intakeQuestions,
      };

      if (hasSchedule) {
        const { error: updateError } = await (supabase
          .from('availability_schedules') as any)
          .update(updates)
          .eq('creator_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await (supabase
          .from('availability_schedules') as any)
          .insert({
            creator_id: user.id,
            ...updates,
          });

        if (insertError) throw insertError;
        setHasSchedule(true);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addIntakeQuestion = () => {
    if (intakeQuestions.length >= 3) return;
    setIntakeQuestions([
      ...intakeQuestions,
      { id: crypto.randomUUID(), question: '', required: false },
    ]);
  };

  const updateIntakeQuestion = (id: string, updates: Partial<IntakeQuestion>) => {
    setIntakeQuestions(intakeQuestions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const removeIntakeQuestion = (id: string) => {
    setIntakeQuestions(intakeQuestions.filter(q => q.id !== id));
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
            Booking Settings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Configure policies, video platform, and intake questions
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
          Settings saved successfully!
        </div>
      )}

      {/* Cancellation Policy */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Cancellation Policy
          </h2>
          <div className="space-y-3">
            {CANCELLATION_POLICIES.map(policy => (
              <label
                key={policy.value}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                  cancellationPolicy === policy.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="cancellationPolicy"
                  value={policy.value}
                  checked={cancellationPolicy === policy.value}
                  onChange={(e) => setCancellationPolicy(e.target.value as CancellationPolicy)}
                  className="h-5 w-5 text-brand-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {policy.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {policy.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Limits */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Booking Limits
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Minimum Notice Required
              </label>
              <select
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {NOTICE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Buyers must book at least this much time in advance
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Bookings Per Day
              </label>
              <select
                value={maxBookingsPerDay}
                onChange={(e) => setMaxBookingsPerDay(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {MAX_BOOKINGS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Limit the number of calls you take per day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Platform */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Video Call Platform
          </h2>
          <div className="space-y-3">
            {VIDEO_PLATFORMS.map(platform => (
              <label
                key={platform.value}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                  videoPlatform === platform.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="videoPlatform"
                  value={platform.value}
                  checked={videoPlatform === platform.value}
                  onChange={(e) => setVideoPlatform(e.target.value as VideoPlatform)}
                  className="h-5 w-5 text-brand-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {platform.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {platform.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {videoPlatform !== 'whereby' && (
            <div className="mt-4">
              <Input
                label="Video Call Link"
                placeholder={
                  videoPlatform === 'zoom'
                    ? 'https://zoom.us/j/1234567890'
                    : videoPlatform === 'google_meet'
                    ? 'https://meet.google.com/abc-defg-hij'
                    : 'https://your-video-link.com'
                }
                value={customVideoUrl}
                onChange={(e) => setCustomVideoUrl(e.target.value)}
                hint="This link will be shared with all your booking customers"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Confirmation Message */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Custom Confirmation Message
          </h2>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            This message will be shown on the success page and included in confirmation emails
          </p>
          <Textarea
            placeholder="Looking forward to our call! Please have your questions ready and be in a quiet space. See you soon!"
            value={customConfirmationMessage}
            onChange={(e) => setCustomConfirmationMessage(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Intake Questions */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Intake Questions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask buyers up to 3 questions before checkout
              </p>
            </div>
            {intakeQuestions.length < 3 && (
              <Button variant="outline" onClick={addIntakeQuestion}>
                + Add Question
              </Button>
            )}
          </div>

          {intakeQuestions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No intake questions set. Click &quot;Add Question&quot; to create one.
            </p>
          ) : (
            <div className="space-y-4">
              {intakeQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Question {index + 1}
                    </span>
                    <button
                      onClick={() => removeIntakeQuestion(question.id)}
                      className="text-error-500 hover:text-error-600"
                    >
                      Remove
                    </button>
                  </div>
                  <Input
                    placeholder="What would you like to discuss?"
                    value={question.question}
                    onChange={(e) => updateIntakeQuestion(question.id, { question: e.target.value })}
                  />
                  <label className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateIntakeQuestion(question.id, { required: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Required
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}

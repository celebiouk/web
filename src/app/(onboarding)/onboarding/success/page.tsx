import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SuccessAnimation } from '@/components/onboarding/success-animation';
import { ShareButtons } from '@/components/onboarding/share-buttons';
import { Button } from '@/components/ui';
import type { Profile } from '@/types/supabase';

export const metadata = {
  title: 'You\'re Live!',
};

/**
 * Success page - shown after completing onboarding
 * Features confetti animation and CTAs
 */
export default async function SuccessPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data } = await supabase
    .from('profiles')
    .select('username, full_name, onboarding_completed')
    .eq('id', user.id)
    .single();

  const profile = data as Pick<Profile, 'username' | 'full_name' | 'onboarding_completed'> | null;

  // If onboarding not completed, redirect back
  if (!profile?.onboarding_completed || !profile?.username) {
    redirect('/onboarding/pick-template');
  }

  const pageUrl = `cele.bio/${profile.username}`;

  return (
    <div className="animate-fade-in mx-auto max-w-lg text-center">
      {/* Confetti Animation */}
      <SuccessAnimation />

      {/* Success Icon */}
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
        <svg
          className="h-10 w-10 text-success-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Header */}
      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        You&apos;re live! 🎉
      </h1>
      <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
        Congratulations, {profile.full_name}! Your page is now live and ready to
        share.
      </p>

      {/* Page URL */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Your page is live at
        </p>
        <Link
          href={`/${profile.username}`}
          className="text-xl font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {pageUrl}
        </Link>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link href="/dashboard">
          <Button size="lg" fullWidth className="sm:w-auto">
            Customize My Page
          </Button>
        </Link>
        <Link href={`/${profile.username}`}>
          <Button variant="outline" size="lg" fullWidth className="sm:w-auto">
            View My Page
          </Button>
        </Link>
      </div>

      {/* Share prompt */}
      <div className="mt-12">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Share your new page with your audience
        </p>
        <ShareButtons pageUrl={pageUrl} />
      </div>
    </div>
  );
}

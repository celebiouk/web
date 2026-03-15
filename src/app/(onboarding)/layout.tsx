import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/supabase';

/**
 * Onboarding layout - shared wrapper for onboarding steps
 * Handles auth check and provides consistent styling
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has already completed onboarding
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed, username')
    .eq('id', user.id)
    .single();

  const profile = data as Pick<Profile, 'onboarding_completed' | 'username'> | null;

  // If onboarding is complete, redirect to dashboard
  if (profile?.onboarding_completed && profile?.username) {
    redirect('/dashboard');
  }

  return (
    <div className="gradient-bg min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="container-page flex items-center justify-between py-4">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            cele<span className="text-brand-600">.bio</span>
          </Link>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step-by-step setup
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container-page py-8 md:py-12">{children}</main>

      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />
    </div>
  );
}

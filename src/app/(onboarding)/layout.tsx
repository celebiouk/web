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
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl">
        <div className="container-page flex items-center justify-between py-4">
          <Link
            href="/"
            className="text-2xl font-bold text-white"
          >
            cele<span className="text-indigo-400">.bio</span>
          </Link>
          <div className="text-sm text-zinc-500">
            Step-by-step setup
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileSetupForm } from '@/components/onboarding/profile-setup-form';
import type { Profile } from '@/types/supabase';

export const metadata = {
  title: 'Setup Your Profile',
};

/**
 * Step 2: Setup your profile
 * Collect basic profile information: name, username, bio, avatar
 */
export default async function SetupProfilePage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get current profile
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;

  // If no template selected, go back to step 1
  if (!profile?.template_id) {
    redirect('/onboarding/pick-template');
  }

  return (
    <div className="animate-fade-in mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          Step 2 of 2
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
          Setup your profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tell your audience who you are. This appears on your public page.
        </p>
      </div>

      {/* Profile Form */}
      <ProfileSetupForm
        userId={user.id}
        initialProfile={{
          fullName: profile?.full_name || '',
          username: profile?.username || '',
          bio: profile?.bio || '',
          avatarUrl: profile?.avatar_url || null,
        }}
      />
    </div>
  );
}

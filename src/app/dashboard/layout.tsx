import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { CommandSearch } from '@/components/dashboard/command-search';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import type { Profile } from '@/types/supabase';

/**
 * Dashboard layout - protected area for creators
 * Features sidebar navigation (desktop) and bottom nav (mobile)
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    redirect('/onboarding/pick-template');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar Navigation - Desktop */}
      <DashboardNav
        profile={{
          id: profile.id,
          fullName: profile.full_name || '',
          username: profile.username || '',
          avatarUrl: profile.avatar_url,
          subscriptionTier: profile.subscription_tier,
        }}
      />

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="container-page py-4 pb-24 lg:pb-6">
          <div className="mb-4 flex items-center justify-end gap-2">
            <CommandSearch />
            <NotificationBell userId={profile.id} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

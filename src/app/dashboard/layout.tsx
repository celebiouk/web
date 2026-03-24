import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { TopBar } from '@/components/dashboard/top-bar';
import type { Profile } from '@/types/supabase';

/**
 * Dashboard layout - protected area for creators
 * Premium design with Vercel/Linear inspired sidebar and top bar
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
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Premium Sidebar - Desktop */}
      <DashboardSidebar
        profile={{
          id: profile.id,
          fullName: profile.full_name || '',
          username: profile.username || '',
          avatarUrl: profile.avatar_url,
          subscriptionTier: profile.subscription_tier,
        }}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[260px]">
        {/* Top Bar */}
        <TopBar
          title="Dashboard"
          userId={profile.id}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-3.5rem)] px-6 py-6 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav username={profile.username || ''} />
    </div>
  );
}

/**
 * Mobile bottom navigation bar
 */
import Link from 'next/link';
import { Home, LayoutGrid, Package, Receipt, Settings } from 'lucide-react';

function MobileNav({ username }: { username: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-zinc-800/60 bg-[#0A0A0B]/95 backdrop-blur-xl lg:hidden">
      <Link
        href="/dashboard"
        className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <Home className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link
        href="/dashboard/page-editor"
        className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[10px] font-medium">Editor</span>
      </Link>
      <Link
        href="/dashboard/products"
        className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <Package className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[10px] font-medium">Products</span>
      </Link>
      <Link
        href="/dashboard/sales"
        className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <Receipt className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[10px] font-medium">Sales</span>
      </Link>
      <Link
        href="/dashboard/settings"
        className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <Settings className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[10px] font-medium">Settings</span>
      </Link>
    </nav>
  );
}

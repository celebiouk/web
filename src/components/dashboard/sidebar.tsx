'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { isFeatureAllowed } from '@/lib/gates/featureGates';
import type { SubscriptionTier } from '@/types/supabase';
import {
  Home,
  LayoutGrid,
  Package,
  Calendar,
  GraduationCap,
  BarChart3,
  Settings,
  Mail,
  Users,
  LogOut,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DashboardSidebarProps {
  profile: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
    subscriptionTier: SubscriptionTier;
  };
}

// Navigation structure
const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'My Page', href: '/dashboard/page', icon: LayoutGrid },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Email', href: '/dashboard/email', icon: Mail },
  { label: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { label: 'Courses', href: '/dashboard/courses', icon: GraduationCap, requiresPro: true },
  { label: 'Affiliates', href: '/dashboard/affiliates', icon: Users, requiresPro: true },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
] as const;

/**
 * Premium Dashboard Sidebar
 * Vercel/Linear inspired design - clean, minimal, sophisticated
 */
export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const isPro = profile.subscriptionTier === 'pro';
  const canAccessCourses = isFeatureAllowed('courses', profile.subscriptionTier);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Get avatar initials
  const initials = profile.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-zinc-800/60 bg-[#0A0A0B] lg:flex">
      {/* Logo Section */}
      <div className="flex h-14 items-center px-5">
        <Link 
          href="/" 
          className="group flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-100 transition-colors hover:text-white"
        >
          cele<span className="text-indigo-400 transition-colors group-hover:text-indigo-300">.bio</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isLocked = item.href === '/dashboard/courses'
              ? !canAccessCourses
              : Boolean('requiresPro' in item && item.requiresPro && !isPro);

            return (
              <Link
                key={item.href}
                href={isLocked ? '/dashboard/settings?upgrade=true' : item.href}
                className={cn(
                  'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
                  isLocked && 'opacity-60'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400" />
                )}
                
                <Icon 
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'
                  )} 
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
                
                {isLocked && (
                  <Lock className="ml-auto h-3.5 w-3.5 text-zinc-600" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings - separated */}
        <div className="mt-4 border-t border-zinc-800/60 pt-4">
          <Link
            href="/dashboard/settings"
            className={cn(
              'group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all duration-150',
              pathname.startsWith('/dashboard/settings')
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            )}
          >
            <Settings 
              className={cn(
                'h-[18px] w-[18px] shrink-0',
                pathname.startsWith('/dashboard/settings') ? 'text-indigo-400' : 'text-zinc-500'
              )} 
              strokeWidth={1.75} 
            />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* View Page Button */}
      <div className="px-3 pb-2">
        <Link
          href={`/${profile.username}`}
          target="_blank"
          className="group flex h-10 w-full items-center justify-between rounded-lg bg-zinc-800/50 px-3 text-[13px] font-medium text-zinc-300 transition-all duration-150 hover:bg-zinc-800 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
            <span>View My Page</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Upgrade Banner - Free users only */}
      {!isPro && (
        <div className="px-3 pb-3">
          <Link
            href="/dashboard/settings?tab=billing"
            className="group relative flex items-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 p-3 transition-all duration-300 hover:from-indigo-500/15 hover:via-purple-500/15 hover:to-indigo-500/15"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-zinc-200">Upgrade to Pro</p>
              <p className="text-[11px] text-zinc-500">0% commission on sales</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}

      {/* User Profile Section */}
      <div className="border-t border-zinc-800/60 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.fullName}
              className="h-9 w-9 shrink-0 rounded-full bg-zinc-800 object-cover ring-1 ring-zinc-700/50"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[13px] font-medium text-zinc-400 ring-1 ring-zinc-700/50">
              {initials}
            </div>
          )}
          
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-200">
              {profile.fullName}
            </p>
            <div className="flex items-center gap-2">
              <p className="truncate text-[12px] text-zinc-500">
                @{profile.username}
              </p>
              <span className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                isPro 
                  ? 'bg-indigo-500/15 text-indigo-400' 
                  : 'bg-zinc-800 text-zinc-500'
              )}>
                {isPro ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}

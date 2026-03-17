'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Badge } from '@/components/ui';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { cn } from '@/lib/utils';
import { DASHBOARD_NAV } from '@/lib/constants';
import type { SubscriptionTier } from '@/types/supabase';
import { isFeatureAllowed } from '@/lib/gates/featureGates';
import {
  Home,
  Layout,
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
} from 'lucide-react';

interface DashboardNavProps {
  profile: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
    subscriptionTier: SubscriptionTier;
  };
}

const iconMap: Record<string, React.ElementType> = {
  home: Home,
  layout: Layout,
  package: Package,
  calendar: Calendar,
  'graduation-cap': GraduationCap,
  'bar-chart': BarChart3,
  settings: Settings,
  mail: Mail,
  users: Users,
};

/**
 * Dashboard navigation component
 * Sidebar on desktop, bottom nav on mobile
 */
export function DashboardNav({ profile }: DashboardNavProps) {
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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 bg-white lg:block dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              <BrandWordmark dotClassName="text-brand-600" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {DASHBOARD_NAV.map((item) => {
              const Icon = iconMap[item.icon] || Home;
              const isActive = pathname === item.href;
              const isLocked = item.href === '/dashboard/courses'
                ? !canAccessCourses
                : Boolean('requiresPro' in item && item.requiresPro && !isPro);

              return (
                <Link
                  key={item.href}
                  href={isLocked ? '/dashboard/settings/billing?upgrade=courses' : item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                    isLocked && 'opacity-60'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          {/* Profile Section */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            {/* View Page Link */}
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="mb-4 flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View My Page</span>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatarUrl}
                name={profile.fullName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {profile.fullName}
                </p>
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    @{profile.username}
                  </p>
                  <Badge
                    variant={isPro ? 'pro' : 'default'}
                    size="sm"
                  >
                    {isPro ? 'Pro' : 'Free'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="mt-4 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white safe-area-bottom lg:hidden dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-around">
          {DASHBOARD_NAV.slice(0, 5).map((item) => {
            const Icon = iconMap[item.icon] || Home;
            const isActive = pathname === item.href;
            const isLocked = item.href === '/dashboard/courses'
              ? !canAccessCourses
              : Boolean('requiresPro' in item && item.requiresPro && !isPro);

            return (
              <Link
                key={item.href}
                href={isLocked ? '/dashboard/settings/billing?upgrade=courses' : item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-500 dark:text-gray-400',
                  isLocked && 'opacity-60'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {isLocked && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Lock className="h-2.5 w-2.5" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

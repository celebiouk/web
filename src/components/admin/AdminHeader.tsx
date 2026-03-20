'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  GraduationCap,
  Calendar,
  DollarSign,
  CreditCard,
  UserPlus,
  Mail,
  FileText,
  TrendingUp,
  Settings,
  Wallet,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const mobileNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Courses', href: '/admin/courses', icon: GraduationCap },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Payouts', href: '/admin/payouts', icon: Wallet },
  { name: 'Affiliates', href: '/admin/affiliates', icon: UserPlus },
  { name: 'Email', href: '/admin/email', icon: Mail },
  { name: 'Moderation', href: '/admin/moderation', icon: Shield },
  { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminHeaderProps {
  user: User;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6 text-gray-500" />
        </button>

        {/* Search */}
        <div className="flex flex-1 items-center gap-4 lg:ml-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, orders, products..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Admin
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Admin
                </span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              {mobileNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

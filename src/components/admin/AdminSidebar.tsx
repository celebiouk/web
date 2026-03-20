'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Shield,
  Settings,
  FileText,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const navigation = [
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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span>← Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import {
  UserPlus,
  Mail,
  Shield,
  Settings,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const quickActions = [
  {
    title: 'Send Announcement',
    description: 'Email all users',
    icon: Mail,
    href: '/admin/email?action=broadcast',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  {
    title: 'Review Flagged Content',
    description: 'Check moderation queue',
    icon: AlertTriangle,
    href: '/admin/moderation',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  },
  {
    title: 'Approve Affiliates',
    description: 'Pending applications',
    icon: UserPlus,
    href: '/admin/affiliates?status=pending',
    color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  },
  {
    title: 'View Audit Logs',
    description: 'Recent admin actions',
    icon: FileText,
    href: '/admin/audit',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  },
  {
    title: 'Security Settings',
    description: 'Configure security',
    icon: Shield,
    href: '/admin/settings?tab=security',
    color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  },
  {
    title: 'Platform Settings',
    description: 'Commission, features',
    icon: Settings,
    href: '/admin/settings',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
  },
];

export function AdminQuickActions() {
  return (
    <div>
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
        Quick Actions
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {action.title}
              </p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  href: string;
}

interface AdminRecentActivityProps {
  title: string;
  items: ActivityItem[];
}

export function AdminRecentActivity({ title, items }: AdminRecentActivityProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <Link
          href={`/admin/${title.toLowerCase().replace(' ', '-')}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {items.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No recent activity
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.title}
                </p>
                <p className="text-sm text-gray-500">{item.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{item.time}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

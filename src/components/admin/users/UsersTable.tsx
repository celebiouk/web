'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Eye,
  Ban,
  UserCheck,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  is_suspended: boolean | null;
  created_at: string;
  subscriptions?: {
    status: string;
    plan: string;
  }[];
}

interface UsersTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
}

export function UsersTable({ users, currentPage, totalPages }: UsersTableProps) {
  const router = useRouter();
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (userId: string, action: string) => {
    setLoading(userId);
    setActionMenuOpen(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      router.refresh();
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {user.full_name?.[0] || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.full_name || 'No name'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                    {user.username ? `@${user.username}` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.subscription_tier === 'pro' || user.subscriptions?.[0]?.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                        <Crown className="h-3 w-3" />
                        Pro
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.is_suspended ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)
                        }
                        disabled={loading === user.id}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
                      >
                        {loading === user.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <MoreHorizontal className="h-5 w-5" />
                        )}
                      </button>

                      {actionMenuOpen === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                            <button
                              onClick={() => handleAction(user.id, user.is_suspended ? 'unsuspend' : 'suspend')}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              {user.is_suspended ? (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Unsuspend
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4" />
                                  Suspend
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleAction(user.id, (user.subscription_tier === 'pro' || user.subscriptions?.[0]?.status === 'active') ? 'downgrade_free' : 'upgrade_pro')}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              {(user.subscription_tier === 'pro' || user.subscriptions?.[0]?.status === 'active') ? (
                                <>
                                  <User className="h-4 w-4" />
                                  Set To Free
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4" />
                                  Grant Pro Access
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

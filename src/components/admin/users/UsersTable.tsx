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
  Trash2,
} from 'lucide-react';
import { GrantProModal } from './GrantProModal';

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
  const [grantModalUser, setGrantModalUser] = useState<User | null>(null);
  const [suspendConfirmUser, setSuspendConfirmUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleteUsernameInput, setDeleteUsernameInput] = useState('');
  const [deleteCommandInput, setDeleteCommandInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAction = async (userId: string, action: string, data?: Record<string, unknown>) => {
    setLoading(userId);
    setActionMenuOpen(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, data }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || 'Action failed');
      }

      setStatusMessage({ type: 'success', text: 'User updated successfully.' });
      router.refresh();
      return true;
    } catch (error) {
      console.error('Action failed:', error);
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Action failed. Please try again.',
      });
      return false;
    } finally {
      setLoading(null);
    }
  };

  const handleProAction = async (user: User) => {
    const isProUser = user.subscription_tier === 'pro' || user.subscriptions?.[0]?.status === 'active';

    if (isProUser) {
      await handleAction(user.id, 'downgrade_free');
      return;
    }

    setGrantModalUser(user);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const canConfirmDelete =
    Boolean(deleteConfirmUser?.username) &&
    deleteUsernameInput.trim() === deleteConfirmUser?.username &&
    deleteCommandInput.trim() === 'Delete this account';

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {statusMessage && (
        <div className={`m-4 rounded-lg border px-4 py-3 text-sm ${
          statusMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/10 dark:text-green-400'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/10 dark:text-red-400'
        }`}>
          {statusMessage.text}
        </div>
      )}

      <div className="overflow-x-auto overflow-y-visible">
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
                          <div className="absolute bottom-full right-0 z-20 mb-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                            <button
                              onClick={() => {
                                if (user.is_suspended) {
                                  void handleAction(user.id, 'unsuspend');
                                  return;
                                }

                                setActionMenuOpen(null);
                                setSuspendConfirmUser(user);
                              }}
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
                              onClick={() => void handleProAction(user)}
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
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                setDeleteConfirmUser(user);
                                setDeleteUsernameInput('');
                                setDeleteCommandInput('');
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Account
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

      <GrantProModal
        isOpen={Boolean(grantModalUser)}
        userLabel={grantModalUser?.full_name || grantModalUser?.username || 'this user'}
        isLoading={loading === grantModalUser?.id}
        onClose={() => {
          if (!loading) {
            setGrantModalUser(null);
          }
        }}
        onSubmit={async ({ hasPaid, reason }) => {
          if (!grantModalUser) {
            return;
          }

          const ok = await handleAction(grantModalUser.id, 'upgrade_pro', { hasPaid, reason });
          if (ok) {
            setGrantModalUser(null);
          }
        }}
      />

      {suspendConfirmUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!loading) {
                setSuspendConfirmUser(null);
              }
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suspend Account</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to suspend this account?
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {suspendConfirmUser.full_name || suspendConfirmUser.username || 'This user'} will not be able to use the account while suspended.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSuspendConfirmUser(null)}
                disabled={loading === suspendConfirmUser.id}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await handleAction(suspendConfirmUser.id, 'suspend');
                  if (ok) {
                    setSuspendConfirmUser(null);
                  }
                }}
                disabled={loading === suspendConfirmUser.id}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Yes Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!loading) {
                setDeleteConfirmUser(null);
              }
            }}
          />

          <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Account</h3>
            <p className="mt-3 text-base text-gray-700 dark:text-gray-300">
              This will permanently delete the account and related resources. This action cannot be undone.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  To confirm, type the username <span className="font-semibold">&quot;{deleteConfirmUser.username || 'missing-username'}&quot;</span>
                </label>
                <input
                  type="text"
                  value={deleteUsernameInput}
                  onChange={(event) => setDeleteUsernameInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder={deleteConfirmUser.username || 'username'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  To confirm, type <span className="font-semibold">&quot;Delete this account&quot;</span>
                </label>
                <input
                  type="text"
                  value={deleteCommandInput}
                  onChange={(event) => setDeleteCommandInput(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Delete this account"
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/10 dark:text-red-400">
              Deleting this account cannot be undone.
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={loading === deleteConfirmUser.id}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await handleAction(deleteConfirmUser.id, 'delete_account', {
                    confirmUsername: deleteUsernameInput.trim(),
                    confirmCommand: deleteCommandInput.trim(),
                  });

                  if (ok) {
                    setDeleteConfirmUser(null);
                    setDeleteUsernameInput('');
                    setDeleteCommandInput('');
                  }
                }}
                disabled={loading === deleteConfirmUser.id || !canConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, UserCheck, Crown, User } from 'lucide-react';

interface UserActionsPanelProps {
  userId: string;
  isSuspended: boolean;
  isPro: boolean;
}

export function UserActionsPanel({ userId, isSuspended, isPro }: UserActionsPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: 'suspend' | 'unsuspend' | 'upgrade_pro' | 'downgrade_free', data?: Record<string, unknown>) {
    setIsLoading(true);

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

      router.refresh();
    } catch (error) {
      console.error('Admin user action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProAction() {
    if (isPro) {
      await handleAction('downgrade_free');
      return;
    }

    const hasPaid = window.confirm('Has this user paid for Pro? Click OK for Yes, Cancel for No.');
    const reason = window.prompt('Enter reason for granting Pro access (required):');

    if (!reason || !reason.trim()) {
      alert('Reason is required to grant Pro access.');
      return;
    }

    await handleAction('upgrade_pro', {
      hasPaid,
      reason: reason.trim(),
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage account state and subscription tier.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => handleAction(isSuspended ? 'unsuspend' : 'suspend')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {isSuspended ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          {isSuspended ? 'Unsuspend User' : 'Suspend User'}
        </button>

        <button
          onClick={() => void handleProAction()}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {isPro ? <User className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
          {isPro ? 'Set To Free' : 'Grant Pro Access'}
        </button>
      </div>
    </div>
  );
}

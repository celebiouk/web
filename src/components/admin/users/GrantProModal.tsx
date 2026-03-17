'use client';

import { useEffect, useState } from 'react';

interface GrantProModalProps {
  isOpen: boolean;
  userLabel: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: { hasPaid: boolean; reason: string }) => Promise<void>;
}

export function GrantProModal({ isOpen, userLabel, isLoading, onClose, onSubmit }: GrantProModalProps) {
  const [hasPaid, setHasPaid] = useState(true);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasPaid(true);
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit() {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Please enter a reason before granting Pro access.');
      return;
    }

    setError(null);
    await onSubmit({ hasPaid, reason: trimmedReason });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grant Pro Access</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Confirm details before upgrading {userLabel} to Pro.</p>

        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <input
              type="checkbox"
              checked={hasPaid}
              onChange={(event) => setHasPaid(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User has paid for Pro</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason (required)</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: Manual payment verified via bank transfer"
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/10 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isLoading ? 'Granting...' : 'Grant Pro'}
          </button>
        </div>
      </div>
    </div>
  );
}

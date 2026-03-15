'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type StripeStatus = 'not_connected' | 'pending' | 'complete';

interface PaymentsState {
  loading: boolean;
  connecting: boolean;
  openingDashboard: boolean;
  status: StripeStatus;
  accountId: string | null;
  error: string | null;
}

/**
 * Payments Settings Page
 * Stripe Connect onboarding and payout management
 */
export default function PaymentsSettingsPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PaymentsState>({
    loading: true,
    connecting: false,
    openingDashboard: false,
    status: 'not_connected',
    accountId: null,
    error: null,
  });

  // Check for URL params from callback
  const connectedParam = searchParams.get('connected');
  const errorParam = searchParams.get('error');

  // Fetch current Stripe status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        
        const data = await res.json();
        setState(prev => ({
          ...prev,
          loading: false,
          status: data.stripe_account_status || 'not_connected',
          accountId: data.stripe_account_id || null,
        }));
      } catch (error) {
        console.error('Failed to fetch Stripe status:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load payment settings',
        }));
      }
    }

    fetchStatus();
  }, []);

  // Handle success/error params
  useEffect(() => {
    if (connectedParam === 'true') {
      setState(prev => ({ ...prev, status: 'complete' }));
    } else if (connectedParam === 'pending') {
      setState(prev => ({ ...prev, status: 'pending' }));
    }
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        no_account: 'Stripe account not found. Please try connecting again.',
        callback_failed: 'Failed to complete Stripe setup. Please try again.',
        refresh_failed: 'Failed to continue Stripe setup. Please try again.',
      };
      setState(prev => ({
        ...prev,
        error: errorMessages[errorParam] || 'An error occurred with Stripe.',
      }));
    }
  }, [connectedParam, errorParam]);

  // Connect to Stripe
  const handleConnect = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error('Connect error:', error);
      setState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to start Stripe onboarding. Please try again.',
      }));
    }
  }, []);

  // Open Stripe dashboard
  const handleOpenDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, openingDashboard: true }));

    try {
      const res = await fetch('/api/stripe/dashboard');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open dashboard');
      }

      // Open in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Dashboard error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to open Stripe dashboard. Please try again.',
      }));
    } finally {
      setState(prev => ({ ...prev, openingDashboard: false }));
    }
  }, []);

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Settings
          </h1>
          <p className="text-sm text-gray-500">
            Connect Stripe to receive payments from your customers
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to Settings
        </Link>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {/* Success Alert */}
      {connectedParam === 'true' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          🎉 Stripe connected successfully! You can now receive payments.
        </div>
      )}

      {/* Stripe Connect Card */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
        {state.status === 'not_connected' ? (
          <NotConnectedState 
            onConnect={handleConnect} 
            connecting={state.connecting} 
          />
        ) : state.status === 'pending' ? (
          <PendingState 
            onContinue={handleConnect} 
            connecting={state.connecting} 
          />
        ) : (
          <ConnectedState 
            onOpenDashboard={handleOpenDashboard}
            openingDashboard={state.openingDashboard}
          />
        )}
      </div>

      {/* Fee Information */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Fee Structure
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl dark:bg-gray-700">
              🆓
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Free Tier</h3>
              <p className="text-sm text-gray-500">
                8% platform fee + Stripe processing fees (~2.9% + 30¢)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-lg bg-primary/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xl">
              ⭐
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Pro Tier</h3>
              <p className="text-sm text-gray-500">
                0% platform fee — only pay Stripe processing fees
              </p>
              <Link
                href="/dashboard/settings/billing"
                className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary/80"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Need Help?
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Stripe Express makes it easy to receive payments. Setup takes about 5 minutes 
          and requires basic identity verification.
        </p>
        <a
          href="https://stripe.com/connect"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Learn more about Stripe Connect →
        </a>
      </div>
    </div>
  );
}

// Not Connected State Component
function NotConnectedState({ 
  onConnect, 
  connecting 
}: { 
  onConnect: () => void; 
  connecting: boolean;
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        Connect Your Stripe Account
      </h2>
      <p className="mx-auto mb-6 max-w-md text-gray-500">
        To start receiving payments for your products, you need to connect a Stripe account. 
        This only takes a few minutes.
      </p>
      <button
        onClick={onConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-8 py-3 font-semibold text-white transition-all hover:bg-[#5048e5] disabled:opacity-50"
      >
        {connecting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Connecting...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="currentColor">
              <path d="M11.5 3.5l-1 6h-4l1-6h4zm6 0l-1 6h-4l1-6h4zm6 0l-1 6h-4l1-6h4zm-13 8l-1 6h-4l1-6h4zm6 0l-1 6h-4l1-6h4zm6 0l-1 6h-4l1-6h4zm-13 8l-1 6h-4l1-6h4zm6 0l-1 6h-4l1-6h4zm6 0l-1 6h-4l1-6h4z" />
            </svg>
            Connect with Stripe
          </>
        )}
      </button>
      <p className="mt-4 text-xs text-gray-400">
        You&apos;ll be redirected to Stripe to complete setup securely
      </p>
    </div>
  );
}

// Pending State Component
function PendingState({ 
  onContinue, 
  connecting 
}: { 
  onContinue: () => void; 
  connecting: boolean;
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
        <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        Complete Your Setup
      </h2>
      <p className="mx-auto mb-6 max-w-md text-gray-500">
        Your Stripe account setup is not complete. Please continue to finish verification 
        and enable payments.
      </p>
      <button
        onClick={onContinue}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-8 py-3 font-semibold text-white transition-all hover:bg-yellow-600 disabled:opacity-50"
      >
        {connecting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Loading...
          </>
        ) : (
          <>Continue Setup</>
        )}
      </button>
    </div>
  );
}

// Connected State Component
function ConnectedState({ 
  onOpenDashboard,
  openingDashboard 
}: { 
  onOpenDashboard: () => void;
  openingDashboard: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 sm:flex-row sm:items-start">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Stripe Connected
          </h2>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        </div>
        <p className="mb-4 text-gray-500">
          You&apos;re all set to receive payments! Your earnings will be automatically 
          transferred to your connected bank account.
        </p>
        <button
          onClick={onOpenDashboard}
          disabled={openingDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {openingDashboard ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              Opening...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Manage Payouts
            </>
          )}
        </button>
      </div>
    </div>
  );
}

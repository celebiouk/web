'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { ShieldCheck } from 'lucide-react';

function ResetPasswordVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!tokenHash || type !== 'recovery') {
      setError('This reset link is invalid. Please request a new one.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, type }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'This reset link is expired or invalid.');
        return;
      }

      router.replace('/reset-password');
      router.refresh();
    } catch {
      setError('Failed to verify reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-bold text-gray-900 dark:text-white"
        >
          cele<span className="text-brand-600">.bio</span>
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/10">
              <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Confirm password reset</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Click continue to securely open your reset form.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <Button type="button" fullWidth isLoading={isLoading} onClick={handleContinue}>
            Continue to reset password
          </Button>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Link not working? <Link href="/forgot-password" className="text-brand-600 dark:text-brand-400">Request a new one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordVerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" /></div>}>
      <ResetPasswordVerifyContent />
    </Suspense>
  );
}

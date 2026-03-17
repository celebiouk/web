'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { BrandWordmark } from '@/components/ui/brand-wordmark';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // User should have a session from the recovery link
      setIsValidSession(!!session);
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center px-4 py-12">
        <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none fixed -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />
        
        <div className="relative z-10 w-full max-w-md">
          <Link
            href="/"
            className="mb-8 block text-center text-2xl font-bold text-gray-900 dark:text-white"
          >
            <BrandWordmark dotClassName="text-brand-600" />
          </Link>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/10">
                <AlertCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Link expired
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                This password reset link has expired or is invalid.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block"
              >
                <Button>Request a new link</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent-400/20 blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-bold text-gray-900 dark:text-white"
        >
          <BrandWordmark dotClassName="text-brand-600" />
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Password updated
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Your password has been reset successfully. Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/10">
                  <Lock className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Set new password
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Your new password must be at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                    {error}
                  </div>
                )}

                <Input
                  type="password"
                  label="New Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <Button type="submit" fullWidth isLoading={isLoading}>
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

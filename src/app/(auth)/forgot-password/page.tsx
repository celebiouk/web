'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 block text-center text-2xl font-bold text-gray-900 dark:text-white"
      >
        cele<span className="text-brand-600">.bio</span>
      </Link>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {isSuccess ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Check your email
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We sent a password reset link to{' '}
              <span className="font-medium text-gray-900 dark:text-white">{email}</span>
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/10">
                <Mail className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Forgot password?
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                No worries, we&apos;ll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </div>
              )}

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>

            <p className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

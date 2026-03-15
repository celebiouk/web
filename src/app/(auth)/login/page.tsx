'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Spinner } from '@/components/ui';
import { OAuthButtons, OAuthDivider } from '@/components/ui/OAuthButtons';

/**
 * Login form component - uses useSearchParams
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect after successful login
      router.push(redirectTo);
      router.refresh();
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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Log in to manage your page
          </p>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons redirectTo={redirectTo} />

        <OAuthDivider />

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

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Login page - wrapped in Suspense for useSearchParams
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
      <LoginForm />
    </Suspense>
  );
}

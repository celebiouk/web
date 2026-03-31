'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Spinner } from '@/components/ui';
import { OAuthButtons, OAuthDivider } from '@/components/ui/OAuthButtons';
import { BrandWordmark } from '@/components/ui/brand-wordmark';

/**
 * Login form component - uses useSearchParams
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const oauthErrorMessage = (() => {
    if (!oauthError) return null;

    const decodedDescription = oauthErrorDescription
      ? decodeURIComponent(oauthErrorDescription.replace(/\+/g, ' ')).toLowerCase()
      : null;

    switch (oauthError) {
      case 'tiktok_not_configured':
        return 'TikTok Login Kit is not configured yet. Add TIKTOK_CLIENT_ID and TIKTOK_CLIENT_SECRET, then try again.';
      case 'tiktok_auth_failed':
        return 'TikTok login failed. Please try again.';
      case 'server_error':
        if (decodedDescription?.includes('provider is not enabled')) {
          return 'Google sign-in is not configured yet. Enable Google in Supabase Auth > Providers and add your Google OAuth client ID/secret.';
        }
        if (decodedDescription?.includes('redirect_uri_mismatch') || decodedDescription?.includes('redirect uri mismatch')) {
          return 'Google redirect URL mismatch. Re-check callback URLs in Supabase Auth URL Configuration and Google Cloud OAuth.';
        }
        return 'OAuth provider error. Please try again.';
      case 'verification_failed':
        return 'Email verification failed. Please request a new verification link.';
      case 'auth_callback_error':
        return 'Authentication failed. Please try again.';
      default:
        return oauthErrorDescription ? decodeURIComponent(oauthErrorDescription.replace(/\+/g, ' ')) : 'Login failed. Please try again.';
    }
  })();

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
        <BrandWordmark dotClassName="text-brand-600" />
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
          {(oauthErrorMessage || error) && (
            <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {oauthErrorMessage || error}
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

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

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

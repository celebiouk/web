'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Provider as SupabaseProvider } from '@supabase/supabase-js';

type Provider = 'google' | 'tiktok';

interface OAuthButtonsProps {
  redirectTo?: string;
}

/**
 * OAuth social login buttons for Google and TikTok
 */
export function OAuthButtons({ redirectTo }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: Provider) => {
    setLoadingProvider(provider);
    setError(null);

    try {
      if (provider === 'tiktok') {
        const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : '';
        window.location.href = `/api/auth/tiktok/start${next}`;
        return;
      }

      const supabase = createClient();
      const callbackPath = '/auth/callback';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as SupabaseProvider,
        options: {
          redirectTo: `${window.location.origin}${callbackPath}${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
          queryParams:
            provider === 'google'
              ? {
                  access_type: 'offline',
                  prompt: 'consent',
                }
              : undefined,
        },
      });

      if (error) {
        setError(error.message);
        setLoadingProvider(null);
      }
    } catch {
      setError('An unexpected error occurred');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleOAuthLogin('google')}
        disabled={loadingProvider !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {loadingProvider === 'google' ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </button>

      {/* TikTok Button */}
      <button
        type="button"
        onClick={() => handleOAuthLogin('tiktok')}
        disabled={loadingProvider !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {loadingProvider === 'tiktok' ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
              fill="currentColor"
            />
          </svg>
        )}
        Continue with TikTok
      </button>
    </div>
  );
}

/**
 * Divider with "or" text
 */
export function OAuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-4 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          or continue with email
        </span>
      </div>
    </div>
  );
}

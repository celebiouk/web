import type { SupabaseClient } from '@supabase/supabase-js';
import type { SocialPlatform } from '../adapters/types';

// Refresh strategy per platform. Most use OAuth refresh_token grant.
// IG/FB use a different "exchange long-lived token" endpoint — we'll wire
// those up the first time an account on those platforms reaches near-expiry.

interface AccountRow {
  id: string;
  platform: SocialPlatform;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
}

const TEN_MINUTES = 10 * 60 * 1000;

function needsRefresh(account: AccountRow): boolean {
  if (!account.token_expires_at) return false;
  return new Date(account.token_expires_at).getTime() - Date.now() < TEN_MINUTES;
}

/**
 * Refresh the account's access token if it's near expiry. Returns the token
 * the engine should actually use (refreshed if applicable, otherwise the
 * existing one). On hard failure returns null so the caller can skip the post.
 */
export async function refreshIfNeeded(
  supabase: SupabaseClient,
  account: AccountRow
): Promise<string | null> {
  if (!needsRefresh(account) || !account.refresh_token) {
    return account.access_token;
  }

  const refreshed = await callRefresh(account.platform, account.refresh_token);
  if (!refreshed) {
    await markAccountExpired(supabase, account.id);
    return null;
  }

  const newExpiry = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null;

  await (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (k: string, v: string) => Promise<unknown> } } })
    .from('social_accounts')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? account.refresh_token,
      token_expires_at: newExpiry,
      last_refreshed_at: new Date().toISOString(),
      status: 'active',
      last_error: null,
    })
    .eq('id', account.id);

  return refreshed.access_token;
}

interface RefreshResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function callRefresh(platform: SocialPlatform, refreshToken: string): Promise<RefreshResult | null> {
  switch (platform) {
    case 'tiktok':
      return refreshOAuth('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: process.env.TIKTOK_CLIENT_ID,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
    case 'linkedin':
      return refreshOAuth('https://www.linkedin.com/oauth/v2/accessToken', {
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
    case 'youtube':
      return refreshOAuth('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
    case 'twitter':
      return refreshOAuth('https://api.twitter.com/2/oauth2/token', {
        client_id: process.env.TWITTER_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
    case 'instagram':
    case 'facebook':
    case 'threads':
      // Meta tokens use a different exchange flow — not wired up yet.
      return null;
  }
}

async function refreshOAuth(url: string, params: Record<string, string | undefined>): Promise<RefreshResult | null> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.set(k, v);
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return null;
    const data = await res.json() as RefreshResult;
    if (!data.access_token) return null;
    return data;
  } catch {
    return null;
  }
}

async function markAccountExpired(supabase: SupabaseClient, accountId: string) {
  await (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (k: string, v: string) => Promise<unknown> } } })
    .from('social_accounts')
    .update({
      status: 'expired',
      last_error: 'Token refresh failed',
    })
    .eq('id', accountId);
}

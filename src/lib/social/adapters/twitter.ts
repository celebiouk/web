import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// X (Twitter) v2 API. Requires paid Basic tier ($200/mo) to post.
// Defer until paying Pro users exist.

function isConfigured(): boolean {
  return Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('X (Twitter)');

  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content.caption.slice(0, 280) }),
    });

    if (res.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'X token rejected', retryable: false };
    }
    if (res.status === 429) {
      return { ok: false, code: 'RATE_LIMITED', message: 'X rate limit hit', retryable: true };
    }
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: res.status >= 500 };
    }

    const data = await res.json() as { data?: { id?: string } };
    const id = data.data?.id ?? '';
    return {
      ok: true,
      platform_post_id: id,
      platform_post_url: id && account.platform_username
        ? `https://twitter.com/${account.platform_username}/status/${id}`
        : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : String(err),
      retryable: true,
    };
  }
}

export const twitterAdapter: SocialAdapter = {
  platform: 'twitter',
  isConfigured,
  post,
};

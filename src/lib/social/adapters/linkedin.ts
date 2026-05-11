import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// LinkedIn UGC Posts API. Personal profile + Pages.
// Approval: typically days. First platform to expect ready.

function isConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('LinkedIn');

  try {
    const author = `urn:li:person:${account.platform_user_id}`;

    // Text-only path — media uploads need the assets register step, which we
    // add when the first creator actually attaches an image.
    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content.caption },
          shareMediaCategory: content.media.length > 0 ? 'IMAGE' : 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'LinkedIn token rejected', retryable: false };
    }
    if (res.status === 429) {
      return { ok: false, code: 'RATE_LIMITED', message: 'LinkedIn rate limit hit', retryable: true };
    }
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: res.status >= 500 };
    }

    const postId = res.headers.get('x-restli-id') ?? '';
    return {
      ok: true,
      platform_post_id: postId,
      platform_post_url: postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined,
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

export const linkedinAdapter: SocialAdapter = {
  platform: 'linkedin',
  isConfigured,
  post,
};

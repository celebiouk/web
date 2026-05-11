import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// Facebook Pages publishing (Graph API). Uses page access token stored on the account.

function isConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('Facebook Pages');

  try {
    const pageId = (account.meta?.page_id as string | undefined) ?? account.platform_user_id;
    const firstMedia = content.media[0];

    // Photo path
    if (firstMedia?.type === 'image') {
      const params = new URLSearchParams({
        url: firstMedia.url,
        caption: content.caption,
        access_token: account.access_token,
      });
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/photos?${params}`,
        { method: 'POST' }
      );
      if (res.status === 401) {
        return { ok: false, code: 'TOKEN_EXPIRED', message: 'Facebook token rejected', retryable: false };
      }
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: res.status >= 500 };
      }
      const { post_id } = await res.json() as { post_id: string };
      return {
        ok: true,
        platform_post_id: post_id,
        platform_post_url: `https://www.facebook.com/${post_id}`,
      };
    }

    // Text-only post
    const params = new URLSearchParams({
      message: content.caption,
      access_token: account.access_token,
    });
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/feed?${params}`,
      { method: 'POST' }
    );
    if (res.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'Facebook token rejected', retryable: false };
    }
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: res.status >= 500 };
    }
    const { id } = await res.json() as { id: string };
    return {
      ok: true,
      platform_post_id: id,
      platform_post_url: `https://www.facebook.com/${id}`,
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

export const facebookAdapter: SocialAdapter = {
  platform: 'facebook',
  isConfigured,
  post,
};

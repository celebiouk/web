import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// Instagram Graph API (Business / Creator accounts only).
// Two-step publish: create media container → publish container.
// Approval: 2-6 weeks Meta App Review.

function isConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('Instagram');

  try {
    // IG business accounts have an "ig_business_id" stored in meta.
    const igBusinessId = (account.meta?.ig_business_id as string | undefined) ?? account.platform_user_id;
    const firstMedia = content.media[0];
    if (!firstMedia) {
      return { ok: false, code: 'INVALID_MEDIA', message: 'Instagram requires at least one image or video', retryable: false };
    }

    // Step 1: container
    const createParams = new URLSearchParams({
      caption: content.caption,
      access_token: account.access_token,
    });
    if (firstMedia.type === 'image') createParams.set('image_url', firstMedia.url);
    if (firstMedia.type === 'video') {
      createParams.set('media_type', 'REELS');
      createParams.set('video_url', firstMedia.url);
    }

    const createRes = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessId}/media?${createParams}`,
      { method: 'POST' }
    );
    if (createRes.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'Instagram token rejected', retryable: false };
    }
    if (!createRes.ok) {
      const err = await createRes.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: createRes.status >= 500 };
    }
    const { id: containerId } = await createRes.json() as { id: string };

    // Step 2: publish
    const pubRes = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessId}/media_publish?creation_id=${containerId}&access_token=${account.access_token}`,
      { method: 'POST' }
    );
    if (!pubRes.ok) {
      const err = await pubRes.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: pubRes.status >= 500 };
    }

    const { id: postId } = await pubRes.json() as { id: string };
    return {
      ok: true,
      platform_post_id: postId,
      platform_post_url: `https://www.instagram.com/p/${postId}`,
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

export const instagramAdapter: SocialAdapter = {
  platform: 'instagram',
  isConfigured,
  post,
};

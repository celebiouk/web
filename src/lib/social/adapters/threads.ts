import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// Threads API (Meta). Two-step publish: create container → publish container.
// Uses the same Meta dev account as IG/FB.

function isConfigured(): boolean {
  return Boolean(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('Threads');

  try {
    const userId = account.platform_user_id;
    const firstMedia = content.media[0];
    const mediaType = !firstMedia ? 'TEXT' : firstMedia.type === 'video' ? 'VIDEO' : 'IMAGE';

    // Step 1: create media container
    const createParams = new URLSearchParams({
      media_type: mediaType,
      text: content.caption,
      access_token: account.access_token,
    });
    if (firstMedia?.type === 'image') createParams.set('image_url', firstMedia.url);
    if (firstMedia?.type === 'video') createParams.set('video_url', firstMedia.url);

    const createRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?${createParams}`,
      { method: 'POST' }
    );
    if (!createRes.ok) {
      const err = await createRes.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: createRes.status >= 500 };
    }
    const { id: containerId } = await createRes.json() as { id: string };

    // Step 2: publish container
    const pubRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${containerId}&access_token=${account.access_token}`,
      { method: 'POST' }
    );
    if (pubRes.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'Threads token rejected', retryable: false };
    }
    if (!pubRes.ok) {
      const err = await pubRes.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: pubRes.status >= 500 };
    }

    const { id: postId } = await pubRes.json() as { id: string };
    return {
      ok: true,
      platform_post_id: postId,
      platform_post_url: account.platform_username
        ? `https://www.threads.net/@${account.platform_username}/post/${postId}`
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

export const threadsAdapter: SocialAdapter = {
  platform: 'threads',
  isConfigured,
  post,
};

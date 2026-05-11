import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// TikTok Content Posting API.
// Approval: 2-8 weeks. Video-only (no plain text or photo carousels here).

function isConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('TikTok');

  try {
    const video = content.media.find((m) => m.type === 'video');
    if (!video) {
      return { ok: false, code: 'INVALID_MEDIA', message: 'TikTok requires a video', retryable: false };
    }

    // PULL_FROM_URL initiates an async upload; TikTok pulls the video itself.
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content.caption.slice(0, 2200),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: video.url,
        },
      }),
    });

    if (res.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'TikTok token rejected', retryable: false };
    }
    if (res.status === 429) {
      return { ok: false, code: 'RATE_LIMITED', message: 'TikTok rate limit hit', retryable: true };
    }
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: res.status >= 500 };
    }

    const data = await res.json() as { data?: { publish_id?: string } };
    const publishId = data.data?.publish_id ?? '';
    // TikTok's publish is async — the publish_id is what we'd poll for the
    // final video_id. For V1 we record it as the platform_post_id; the
    // analytics-refresh job will resolve it later.
    return {
      ok: true,
      platform_post_id: publishId,
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

export const tiktokAdapter: SocialAdapter = {
  platform: 'tiktok',
  isConfigured,
  post,
};

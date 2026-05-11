import type { AdapterAccount, AdapterContent, AdapterResult, SocialAdapter } from './types';
import { unimplementedResult } from './_unimplemented';

// YouTube Data API v3 — Shorts upload via videos.insert (resumable upload).
// V1 implementation does a simple multipart upload; we'll move to resumable
// once we hit videos large enough to need it.

function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function post(account: AdapterAccount, content: AdapterContent): Promise<AdapterResult> {
  if (!isConfigured()) return unimplementedResult('YouTube');

  try {
    const video = content.media.find((m) => m.type === 'video');
    if (!video) {
      return { ok: false, code: 'INVALID_MEDIA', message: 'YouTube requires a video', retryable: false };
    }

    // Pull the video bytes so we can multipart-upload them to YouTube.
    const videoBytes = await fetch(video.url).then((r) => r.arrayBuffer());

    const metadata = {
      snippet: {
        // YT title cap is 100 chars; the rest goes into description.
        title: content.caption.slice(0, 95) + (content.caption.length > 95 ? '…' : ''),
        description: content.caption,
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    };

    const boundary = `cele-${Date.now()}`;
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Type: video/*\r\n\r\n`),
      Buffer.from(videoBytes),
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const res = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (res.status === 401) {
      return { ok: false, code: 'TOKEN_EXPIRED', message: 'YouTube token rejected', retryable: false };
    }
    if (res.status === 403) {
      return { ok: false, code: 'PERMISSION_DENIED', message: 'YouTube permission denied (quota or scope)', retryable: false };
    }
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, code: 'PLATFORM_ERROR', message: err.slice(0, 500), retryable: res.status >= 500 };
    }

    const data = await res.json() as { id?: string };
    const id = data.id ?? '';
    return {
      ok: true,
      platform_post_id: id,
      platform_post_url: id ? `https://www.youtube.com/shorts/${id}` : undefined,
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

export const youtubeAdapter: SocialAdapter = {
  platform: 'youtube',
  isConfigured,
  post,
};

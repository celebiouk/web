import type { SocialPlatform } from '../adapters/types';

export interface MetricSnapshot {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

/**
 * Fetch current engagement metrics for an already-published post.
 * Returns null when:
 *  - The platform metrics API isn't implemented yet
 *  - The API returns an error (token scope mismatch, rate limit, etc.)
 * Callers should treat null as "skip this refresh cycle" rather than an error.
 */
export async function fetchMetrics(
  platform: SocialPlatform,
  platformPostId: string,
  accessToken: string
): Promise<MetricSnapshot | null> {
  switch (platform) {
    case 'linkedin':
      return fetchLinkedInMetrics(platformPostId, accessToken);
    // Other platforms are stubs until their analytics APIs are approved.
    // Each returns null so the refresh cron silently skips them.
    case 'instagram':
    case 'facebook':
    case 'threads':
    case 'tiktok':
    case 'twitter':
    case 'youtube':
      return null;
  }
}

// ---------------------------------------------------------------------------
// LinkedIn — Social Actions API
// Requires r_member_social scope (in addition to w_member_social).
// With w_member_social only the endpoint returns 403 — we catch and return null
// so the cron skips gracefully until the scope is added to the LinkedIn app.
// ---------------------------------------------------------------------------
async function fetchLinkedInMetrics(
  ugcPostUrn: string,
  accessToken: string
): Promise<MetricSnapshot | null> {
  try {
    const encoded = encodeURIComponent(ugcPostUrn);
    const res = await fetch(
      `https://api.linkedin.com/v2/socialActions/${encoded}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      likesSummary?: { totalLikes?: number };
      commentsSummary?: { totalFirstLevelComments?: number };
      shareSummary?: { totalShares?: number };
    };

    return {
      views: 0, // Impression counts need the Share Statistics API (r_organization_social_feed)
      likes: data.likesSummary?.totalLikes ?? 0,
      comments: data.commentsSummary?.totalFirstLevelComments ?? 0,
      shares: data.shareSummary?.totalShares ?? 0,
      clicks: 0, // UTM clicks tracked via cele.bio analytics (future)
    };
  } catch {
    return null;
  }
}

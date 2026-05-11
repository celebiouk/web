import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdapter } from '../adapters';
import type {
  AdapterAccount,
  AdapterContent,
  AdapterResult,
  MediaItem,
  SocialPlatform,
} from '../adapters/types';
import { injectUtm } from './utm';
import { refreshIfNeeded } from './token-refresh';

// Exponential backoff retry schedule (minutes) when a retryable failure happens.
const RETRY_DELAYS_MIN = [2, 10, 60];
const MAX_ATTEMPTS = RETRY_DELAYS_MIN.length + 1; // initial attempt + 3 retries

interface ScheduledPostRow {
  id: string;
  creator_id: string;
  caption: string;
  media: MediaItem[];
  platforms: SocialPlatform[];
  platform_overrides: Record<string, { caption?: string; first_comment?: string }>;
  utm_campaign: string | null;
  status: string;
}

export interface PosterSummary {
  postId: string;
  results: Array<{ platform: SocialPlatform; status: string; error?: string }>;
}

/**
 * Process a single scheduled post — fan out across all target platforms,
 * record per-platform results, and update the parent post's status.
 *
 * Uses a "claim" pattern: the parent row is moved to status='posting' before
 * fan-out so a second cron invocation can't double-publish.
 */
export async function processScheduledPost(
  supabase: SupabaseClient,
  postId: string
): Promise<PosterSummary | null> {
  // Atomically claim the post. Only one cron can win this update.
  const { data: claimed, error: claimErr } = await (supabase as unknown as {
    from: (t: string) => {
      update: (v: Record<string, unknown>) => {
        eq: (k: string, v: string) => { eq: (k: string, v: string) => { select: () => { maybeSingle: () => Promise<{ data: ScheduledPostRow | null; error: unknown }> } } }
      }
    }
  })
    .from('scheduled_posts')
    .update({ status: 'posting' })
    .eq('id', postId)
    .eq('status', 'scheduled')
    .select()
    .maybeSingle();

  if (claimErr || !claimed) return null; // someone else got it
  const post = claimed;

  const summary: PosterSummary = { postId, results: [] };

  for (const platform of post.platforms) {
    const result = await postToOnePlatform(supabase, post, platform);
    summary.results.push({
      platform,
      status: result.ok ? 'posted' : result.code,
      error: result.ok ? undefined : result.message,
    });
  }

  // Aggregate status — posted if any succeeded, failed if all failed.
  const anySuccess = summary.results.some((r) => r.status === 'posted');
  const allRetryable = summary.results.every((r) => r.status !== 'posted')
    && summary.results.some((r) => r.error && r.status !== 'NOT_IMPLEMENTED');

  await (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (k: string, v: string) => Promise<unknown> } } })
    .from('scheduled_posts')
    .update({
      status: anySuccess ? 'posted' : allRetryable ? 'scheduled' : 'failed',
      posted_at: anySuccess ? new Date().toISOString() : null,
    })
    .eq('id', postId);

  return summary;
}

async function postToOnePlatform(
  supabase: SupabaseClient,
  post: ScheduledPostRow,
  platform: SocialPlatform
): Promise<AdapterResult> {
  // Find the creator's connected account for this platform.
  const { data: accountRows } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => {
            eq: (k: string, v: string) => Promise<{ data: AccountRow[] | null }>
          }
        }
      }
    }
  })
    .from('social_accounts')
    .select('id,platform,platform_user_id,platform_username,access_token,refresh_token,token_expires_at,meta')
    .eq('creator_id', post.creator_id)
    .eq('platform', platform)
    .eq('status', 'active');

  const account = accountRows?.[0];

  if (!account) {
    return await recordResult(supabase, post, platform, null, {
      ok: false,
      code: 'PERMISSION_DENIED',
      message: `No connected ${platform} account`,
      retryable: false,
    });
  }

  const freshToken = await refreshIfNeeded(supabase, account);
  if (!freshToken) {
    return await recordResult(supabase, post, platform, account.id, {
      ok: false,
      code: 'TOKEN_EXPIRED',
      message: 'Token refresh failed — reconnect required',
      retryable: false,
    });
  }

  const override = post.platform_overrides?.[platform];
  const rawCaption = override?.caption ?? post.caption;
  const caption = injectUtm(rawCaption, {
    source: platform,
    campaign: post.utm_campaign ?? undefined,
  });

  const adapterAccount: AdapterAccount = {
    id: account.id,
    platform: account.platform,
    platform_user_id: account.platform_user_id,
    platform_username: account.platform_username,
    access_token: freshToken,
    refresh_token: account.refresh_token,
    token_expires_at: account.token_expires_at,
    meta: account.meta ?? {},
  };

  const content: AdapterContent = {
    caption,
    media: post.media ?? [],
    overrides: override,
  };

  const adapter = getAdapter(platform);
  const result = await adapter.post(adapterAccount, content);
  return await recordResult(supabase, post, platform, account.id, result);
}

interface AccountRow {
  id: string;
  platform: SocialPlatform;
  platform_user_id: string;
  platform_username: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  meta: Record<string, unknown> | null;
}

async function recordResult(
  supabase: SupabaseClient,
  post: ScheduledPostRow,
  platform: SocialPlatform,
  socialAccountId: string | null,
  result: AdapterResult
): Promise<AdapterResult> {
  // Upsert so retries update the same row instead of inserting duplicates.
  const { data: existing } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: { id: string; attempts: number } | null }>
          }
        }
      }
    }
  })
    .from('post_results')
    .select('id,attempts')
    .eq('scheduled_post_id', post.id)
    .eq('platform', platform)
    .maybeSingle();

  const attempts = (existing?.attempts ?? 0) + 1;
  const nextRetry = computeNextRetry(result, attempts);

  const row = {
    scheduled_post_id: post.id,
    creator_id: post.creator_id,
    platform,
    social_account_id: socialAccountId,
    status: result.ok ? 'posted' : (result.code === 'NOT_IMPLEMENTED' ? 'skipped' : 'failed'),
    platform_post_id: result.ok ? result.platform_post_id : null,
    platform_post_url: result.ok ? result.platform_post_url ?? null : null,
    error_message: result.ok ? null : result.message,
    error_code: result.ok ? null : result.code,
    attempts,
    next_retry_at: nextRetry,
    posted_at: result.ok ? new Date().toISOString() : null,
  };

  if (existing) {
    await (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (k: string, v: string) => Promise<unknown> } } })
      .from('post_results')
      .update(row)
      .eq('id', existing.id);
  } else {
    await (supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> } })
      .from('post_results')
      .insert(row);
  }

  return result;
}

function computeNextRetry(result: AdapterResult, attempts: number): string | null {
  if (result.ok) return null;
  if (!result.retryable) return null;
  if (attempts >= MAX_ATTEMPTS) return null;
  const delayMin = RETRY_DELAYS_MIN[attempts - 1] ?? RETRY_DELAYS_MIN[RETRY_DELAYS_MIN.length - 1];
  return new Date(Date.now() + delayMin * 60 * 1000).toISOString();
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchMetrics } from '@/lib/social/engine/metrics';
import { refreshIfNeeded } from '@/lib/social/engine/token-refresh';
import type { SocialPlatform } from '@/lib/social/adapters/types';

// How far back to look for posts worth refreshing.
const ANALYTICS_WINDOW_DAYS = 7;

// Minimum time between refreshes for the same post_result row.
// Tiered: fresh posts (<24h) are allowed to be refreshed every 2h;
// older posts don't need to be checked more often than once per run anyway
// since the cron itself runs daily on Hobby.
const MIN_REFRESH_GAP_HOURS = 2;

const MAX_ROWS_PER_RUN = 50;

interface ResultRow {
  id: string;
  platform: SocialPlatform;
  platform_post_id: string;
  posted_at: string;
  social_account_id: string | null;
  social_accounts: {
    id: string;
    platform_user_id: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
  } | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();

  const windowCutoff = new Date(
    now.getTime() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const refreshCutoff = new Date(
    now.getTime() - MIN_REFRESH_GAP_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Find posted results within the window that have never been fetched
  // or whose last fetch is older than MIN_REFRESH_GAP_HOURS.
  const { data: rows, error: fetchErr } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          not: (k: string, op: string, v: null) => {
            gte: (k: string, v: string) => {
              or: (f: string) => {
                limit: (n: number) => Promise<{ data: ResultRow[] | null; error: unknown }>
              }
            }
          }
        }
      }
    }
  })
    .from('post_results')
    .select(
      'id,platform,platform_post_id,posted_at,social_account_id,' +
      'social_accounts(id,platform_user_id,access_token,refresh_token,token_expires_at)'
    )
    .eq('status', 'posted')
    .not('platform_post_id', 'is', null)
    .gte('posted_at', windowCutoff)
    .or(`last_metrics_fetched_at.is.null,last_metrics_fetched_at.lt.${refreshCutoff}`)
    .limit(MAX_ROWS_PER_RUN);

  if (fetchErr) {
    console.error('[refresh-post-analytics] query error', fetchErr);
    return NextResponse.json({ success: false, error: String(fetchErr) }, { status: 500 });
  }

  let refreshed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of (rows ?? [])) {
    try {
      const acct = row.social_accounts;
      if (!acct?.access_token) {
        skipped++;
        continue;
      }

      // Refresh token if near expiry — reuses the same logic as the poster.
      const accountForRefresh = {
        id: acct.id,
        platform: row.platform,
        access_token: acct.access_token,
        refresh_token: acct.refresh_token,
        token_expires_at: acct.token_expires_at,
      };

      const freshToken = await refreshIfNeeded(supabase, accountForRefresh);
      if (!freshToken) {
        skipped++;
        continue;
      }

      const metrics = await fetchMetrics(row.platform, row.platform_post_id, freshToken);
      if (!metrics) {
        // Platform not supported yet — still stamp last_metrics_fetched_at so
        // we don't retry every cron tick for platforms that always return null.
        await (supabase as unknown as {
          from: (t: string) => {
            update: (v: Record<string, unknown>) => {
              eq: (k: string, v: string) => Promise<unknown>
            }
          }
        })
          .from('post_results')
          .update({ last_metrics_fetched_at: now.toISOString() })
          .eq('id', row.id);
        skipped++;
        continue;
      }

      await (supabase as unknown as {
        from: (t: string) => {
          update: (v: Record<string, unknown>) => {
            eq: (k: string, v: string) => Promise<unknown>
          }
        }
      })
        .from('post_results')
        .update({
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          clicks: metrics.clicks,
          last_metrics_fetched_at: now.toISOString(),
        })
        .eq('id', row.id);

      refreshed++;
    } catch (err) {
      errors.push(`${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    success: true,
    total: (rows ?? []).length,
    refreshed,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}

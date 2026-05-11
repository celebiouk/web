import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { processScheduledPost } from '@/lib/social/engine/poster';

// Vercel cron: picks up scheduled posts whose time has come and fans them out
// across every targeted platform.
//
// Frequency is set in vercel.json. On Hobby it runs daily (good enough for
// initial testing); once on Pro plan, change schedule to "*/5 * * * *" so
// creators get near-realtime posting.

// Cap how many posts each invocation processes so a backlog can't blow past
// Vercel's function-execution budget.
const MAX_POSTS_PER_INVOCATION = 25;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  // 1. Posts that are due for their initial publish.
  const { data: dueRows } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          lte: (k: string, v: string) => {
            order: (k: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: { id: string }[] | null }>
            }
          }
        }
      }
    }
  })
    .from('scheduled_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(MAX_POSTS_PER_INVOCATION);

  // 2. Per-platform retry rows whose backoff has elapsed — re-runs the parent.
  const { data: retryRows } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          lte: (k: string, v: string) => {
            limit: (n: number) => Promise<{ data: { scheduled_post_id: string }[] | null }>
          }
        }
      }
    }
  })
    .from('post_results')
    .select('scheduled_post_id')
    .eq('status', 'failed')
    .lte('next_retry_at', now)
    .limit(MAX_POSTS_PER_INVOCATION);

  // Flip retry parents back to 'scheduled' so the claim step in processScheduledPost picks them up.
  const retryIds = Array.from(new Set((retryRows ?? []).map((r) => r.scheduled_post_id)));
  if (retryIds.length > 0) {
    await (supabase as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => {
          in: (k: string, v: string[]) => Promise<unknown>
        }
      }
    })
      .from('scheduled_posts')
      .update({ status: 'scheduled' })
      .in('id', retryIds);
  }

  const allIds = Array.from(new Set([
    ...(dueRows ?? []).map((r) => r.id),
    ...retryIds,
  ])).slice(0, MAX_POSTS_PER_INVOCATION);

  let processed = 0;
  let succeeded = 0;
  const errors: string[] = [];

  for (const id of allIds) {
    try {
      const summary = await processScheduledPost(supabase, id);
      if (summary) {
        processed++;
        if (summary.results.some((r) => r.status === 'posted')) succeeded++;
      }
    } catch (err) {
      errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    succeeded,
    queued: allIds.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isFeatureAllowed } from '@/lib/gates/featureGates';
import type { SubscriptionTier } from '@/types/supabase';

const PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin', 'threads', 'facebook'] as const;

const mediaItem = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video']),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  alt: z.string().max(500).optional(),
});

const createSchema = z.object({
  caption: z.string().max(5000).default(''),
  media: z.array(mediaItem).max(10).default([]),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(7),
  scheduled_for: z.string().datetime(),
  timezone: z.string().max(64).default('UTC'),
  platform_overrides: z.record(z.string(), z.object({
    caption: z.string().max(5000).optional(),
    first_comment: z.string().max(2000).optional(),
  })).default({}),
  promoted_product_id: z.string().uuid().nullable().optional(),
  utm_campaign: z.string().max(120).nullable().optional(),
});

// Pro feature — anchor on courses since they share the Pro tier already.
// (Adding 'scheduler' as its own gate key is a larger refactor; the sidebar
// already enforces Pro via the requiresPro flag.)
function requiresPro(tier: SubscriptionTier): boolean {
  return !isFeatureAllowed('courses', tier);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: posts } = await (supabase as any)
    .from('scheduled_posts')
    .select('id,caption,media,platforms,scheduled_for,timezone,status,promoted_product_id,utm_campaign,created_at,posted_at')
    .eq('creator_id', user.id)
    .order('scheduled_for', { ascending: false })
    .limit(100);

  const postIds = (posts ?? []).map((p: { id: string }) => p.id);
  const { data: results } = postIds.length
    ? await (supabase as any)
        .from('post_results')
        .select('scheduled_post_id,platform,status,platform_post_url,error_message')
        .in('scheduled_post_id', postIds)
    : { data: [] };

  return NextResponse.json({ posts: posts ?? [], results: results ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Pro gate
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('subscription_tier')
    .eq('id', user.id)
    .single();
  const tier = ((profile as { subscription_tier?: SubscriptionTier } | null)?.subscription_tier ?? 'free') as SubscriptionTier;
  if (requiresPro(tier)) {
    return NextResponse.json({ error: 'Scheduler is a Pro feature' }, { status: 402 });
  }

  let body;
  try {
    body = createSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request', detail: err instanceof Error ? err.message : 'Bad input' },
      { status: 400 }
    );
  }

  // Reject past timestamps (we don't allow back-dating posts).
  if (new Date(body.scheduled_for).getTime() < Date.now() - 60_000) {
    return NextResponse.json(
      { error: 'scheduled_for must be in the future' },
      { status: 400 }
    );
  }

  const { data: created, error } = await (supabase as any)
    .from('scheduled_posts')
    .insert({
      creator_id: user.id,
      caption: body.caption,
      media: body.media,
      platforms: body.platforms,
      platform_overrides: body.platform_overrides,
      scheduled_for: body.scheduled_for,
      timezone: body.timezone,
      status: 'scheduled',
      promoted_product_id: body.promoted_product_id ?? null,
      utm_campaign: body.utm_campaign ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: created });
}

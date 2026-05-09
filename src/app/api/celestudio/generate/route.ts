import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/celestudio/ai-prompt';
import type { Block } from '@/lib/celestudio/blocks';
import { makeBlockId } from '@/lib/celestudio/blocks';
import { DESIGN_SYSTEMS, type DesignSystemSlug } from '@/lib/celestudio/design-systems';
import { generateJson, type AITier } from '@/lib/celestudio/ai-client';
import { enrichBlocksWithImages } from '@/lib/celestudio/unsplash';

export const maxDuration = 60; // Vercel function timeout (Hobby max)

// 25,000 chars (~5,000 words) is the practical input ceiling for the
// 60s Vercel Hobby timeout. Longer inputs produce longer outputs that
// cannot finish generating in time.
const RequestSchema = z.object({
  sourceText: z.string()
    .min(50, 'Need at least 50 characters of source text')
    .max(25000, 'Source text is too long. Please trim to under 25,000 characters (~5,000 words).'),
  designSystem: z.string(),
  authorName: z.string().max(120).optional(),
  tier: z.enum(['standard', 'premium']).optional(),
});

export async function POST(request: Request) {
  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Pro gating — only Pro users can generate
  const { data: profile } = await (supabase as any).from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.json({ error: 'pro_required' }, { status: 402 });
  }

  // Validate input
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstFieldError = Object.values(flat.fieldErrors)?.[0]?.[0];
    return NextResponse.json({
      error: firstFieldError ?? flat.formErrors?.[0] ?? 'Invalid request',
    }, { status: 422 });
  }

  const { sourceText, designSystem, authorName, tier } = parsed.data;
  if (!(designSystem in DESIGN_SYSTEMS)) {
    return NextResponse.json({ error: 'Unknown design system' }, { status: 422 });
  }

  // Standard tier by default. "premium" reserved for future polish/advanced flows.
  const aiTier: AITier = tier ?? 'standard';

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured (OPENAI_API_KEY missing on server)' }, { status: 500 });
  }

  // 1. Call OpenAI
  let raw = '';
  try {
    raw = await generateJson({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserMessage({ sourceText, designSystemSlug: designSystem, authorName }),
      tier: aiTier,
    });
  } catch (err) {
    const error = err as { status?: number; message?: string };
    console.error('CeleStudio AI call error:', err);
    if (error.status === 401) {
      return NextResponse.json({ error: 'AI authentication failed (key invalid)' }, { status: 500 });
    }
    if (error.status === 429) {
      return NextResponse.json({ error: 'AI rate limit hit, try again in a minute' }, { status: 503 });
    }
    return NextResponse.json({
      error: `AI call failed: ${error.message ?? 'unknown error'}`,
    }, { status: 500 });
  }

  // 2. Parse JSON. response_format=json_object guarantees the outer is JSON,
  // but defend against malformed payloads anyway.
  let parsedJson: Record<string, unknown>;
  try {
    parsedJson = JSON.parse(raw);
  } catch (err) {
    console.error('AI JSON parse failed:', err, raw.slice(0, 500));
    return NextResponse.json({
      error: `AI returned malformed JSON. First 200 chars: ${raw.slice(0, 200)}`,
    }, { status: 502 });
  }

  // 3. Find the blocks array. We try the top level first, then a few common
  // wrapper shapes the model occasionally emits ({ebook: {...}}, {data: {...}}).
  const blocks = findBlocksArray(parsedJson);
  if (!blocks) {
    console.error('AI returned no blocks. Top-level keys:', Object.keys(parsedJson));
    return NextResponse.json({
      error: `AI returned JSON without a blocks array. Keys received: ${Object.keys(parsedJson).join(', ')}`,
    }, { status: 502 });
  }
  if (blocks.length === 0) {
    return NextResponse.json({
      error: 'AI returned an empty blocks array. Try a longer source text.',
    }, { status: 502 });
  }

  // 4. Pull title/subtitle from top-level or nested wrapper
  const title =
    pickString(parsedJson, 'title') ??
    pickString(parsedJson.ebook, 'title') ??
    'Untitled Ebook';
  const subtitle =
    pickString(parsedJson, 'subtitle') ??
    pickString(parsedJson.ebook, 'subtitle') ??
    null;

  // 5. Ensure every block has a stable ID
  const normalizedBlocks = blocks.map(block => ({
    ...block,
    id: (block.id && typeof block.id === 'string') ? block.id : makeBlockId(),
  })) as Block[];

  // 6. Enrich cover + chapter blocks with topical photos from Unsplash.
  // No-op when UNSPLASH_ACCESS_KEY isn't set — renderer falls back to Picsum.
  const finalBlocks = await enrichBlocksWithImages(normalizedBlocks);

  return NextResponse.json({
    title,
    subtitle,
    blocks: finalBlocks,
    designSystem: designSystem as DesignSystemSlug,
    tier: aiTier,
  });
}

// Walk common wrapper shapes the model might emit and return the first blocks
// array we find. Returns null if no valid array exists anywhere expected.
function findBlocksArray(obj: unknown): Block[] | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  if (Array.isArray(o.blocks)) return o.blocks as Block[];
  for (const wrapKey of ['ebook', 'data', 'content', 'result', 'response']) {
    const wrap = o[wrapKey];
    if (Array.isArray(wrap)) return wrap as Block[];
    if (wrap && typeof wrap === 'object' && Array.isArray((wrap as Record<string, unknown>).blocks)) {
      return (wrap as Record<string, unknown>).blocks as Block[];
    }
  }
  return null;
}

function pickString(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : null;
}

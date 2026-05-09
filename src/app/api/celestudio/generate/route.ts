import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/celestudio/ai-prompt';
import type { Block } from '@/lib/celestudio/blocks';
import { makeBlockId } from '@/lib/celestudio/blocks';
import { DESIGN_SYSTEMS, type DesignSystemSlug } from '@/lib/celestudio/design-systems';
import { generateJson, type AITier } from '@/lib/celestudio/ai-client';

export const maxDuration = 60; // Vercel function timeout (Hobby max)

const RequestSchema = z.object({
  sourceText: z.string().min(50, 'Need at least 50 characters of source text').max(60000),
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { sourceText, designSystem, authorName, tier } = parsed.data;
  if (!(designSystem in DESIGN_SYSTEMS)) {
    return NextResponse.json({ error: 'Unknown design system' }, { status: 422 });
  }

  // Standard tier by default. "premium" reserved for future polish/advanced flows.
  const aiTier: AITier = tier ?? 'standard';

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const raw = await generateJson({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserMessage({ sourceText, designSystemSlug: designSystem, authorName }),
      tier: aiTier,
    });

    let parsedJson: { title?: string; subtitle?: string; blocks?: Block[] };
    try {
      parsedJson = JSON.parse(raw);
    } catch (err) {
      console.error('AI JSON parse failed:', err, raw.slice(0, 500));
      return NextResponse.json({ error: 'AI returned malformed JSON' }, { status: 502 });
    }

    if (!Array.isArray(parsedJson.blocks) || parsedJson.blocks.length === 0) {
      return NextResponse.json({ error: 'AI returned no blocks' }, { status: 502 });
    }

    // Ensure every block has a stable ID (fallback if AI didn't include one)
    const normalizedBlocks = parsedJson.blocks.map(block => ({
      ...block,
      id: (block.id && typeof block.id === 'string') ? block.id : makeBlockId(),
    })) as Block[];

    return NextResponse.json({
      title: parsedJson.title ?? 'Untitled Ebook',
      subtitle: parsedJson.subtitle ?? null,
      blocks: normalizedBlocks,
      designSystem: designSystem as DesignSystemSlug,
      tier: aiTier,
    });
  } catch (err) {
    const error = err as { status?: number; message?: string };
    console.error('CeleStudio generate error:', err);
    if (error.status === 401) {
      return NextResponse.json({ error: 'AI authentication failed' }, { status: 500 });
    }
    if (error.status === 429) {
      return NextResponse.json({ error: 'AI rate limit hit, try again in a minute' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

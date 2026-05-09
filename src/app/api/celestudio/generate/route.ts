import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SYSTEM_PROMPT, buildUserMessage } from '@/lib/celestudio/ai-prompt';
import type { Block } from '@/lib/celestudio/blocks';
import { makeBlockId } from '@/lib/celestudio/blocks';
import { DESIGN_SYSTEMS, type DesignSystemSlug } from '@/lib/celestudio/design-systems';

export const maxDuration = 60; // Vercel function timeout (Hobby max)

const RequestSchema = z.object({
  sourceText: z.string().min(50, 'Need at least 50 characters of source text').max(60000),
  designSystem: z.string(),
  authorName: z.string().max(120).optional(),
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

  const { sourceText, designSystem, authorName } = parsed.data;
  if (!(designSystem in DESIGN_SYSTEMS)) {
    return NextResponse.json({ error: 'Unknown design system' }, { status: 422 });
  }

  // Call Claude
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }
  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserMessage({ sourceText, designSystemSlug: designSystem, authorName }) },
      ],
    });

    // Extract text from response
    const textBlock = message.content.find(c => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 502 });
    }

    const raw = textBlock.text.trim();
    const jsonString = stripCodeFences(raw);

    let parsedJson: { title?: string; subtitle?: string; blocks?: Block[] };
    try {
      parsedJson = JSON.parse(jsonString);
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

// Sometimes models wrap JSON in ```json ... ``` despite instructions. Strip it.
function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  return text;
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { DESIGN_SYSTEMS } from '@/lib/celestudio/design-systems';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).nullable().optional(),
  designSystem: z.string(),
  sourceText: z.string().max(60000).optional(),
  blocks: z.array(z.any()),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await (supabase as any).from('celestudio_ebooks')
    .select('id, title, subtitle, design_system, status, cover_image_url, updated_at, created_at')
    .eq('creator_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ebooks: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (!(parsed.data.designSystem in DESIGN_SYSTEMS)) {
    return NextResponse.json({ error: 'Unknown design system' }, { status: 422 });
  }

  const { data, error } = await (supabase as any).from('celestudio_ebooks')
    .insert({
      creator_id: user.id,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      design_system: parsed.data.designSystem,
      source_text: parsed.data.sourceText ?? null,
      blocks: parsed.data.blocks,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ebook: data }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Block } from '@/lib/celestudio/blocks';

const PublishSchema = z.object({
  price_cents: z.number().int().min(0).max(100000000),
  description: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Pro gating
  const { data: profile } = await (supabase as any).from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.json({ error: 'Pro plan required to publish' }, { status: 402 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input — price must be a non-negative integer' }, { status: 422 });
  }

  // Load the ebook
  const { data: ebook, error: ebookErr } = await (supabase as any).from('celestudio_ebooks')
    .select('id, title, subtitle, blocks, design_system, status, published_product_id')
    .eq('id', id)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (ebookErr || !ebook) {
    return NextResponse.json({ error: 'Ebook not found' }, { status: 404 });
  }

  // Pull the cover image URL from the cover block (set by Unsplash enrichment)
  const blocks = (ebook.blocks ?? []) as Block[];
  const coverBlock = blocks.find(b => b.type === 'cover') as Extract<Block, { type: 'cover' }> | undefined;
  const coverImageUrl = coverBlock?.imageUrl ?? null;

  const productPayload = {
    creator_id: user.id,
    title: String(ebook.title).slice(0, 50),
    subtitle: ebook.subtitle ? String(ebook.subtitle).slice(0, 100) : null,
    description: parsed.data.description?.slice(0, 2000) ?? null,
    description_html: null,
    price: parsed.data.price_cents,
    currency: 'usd',
    type: 'digital',
    cover_image_url: coverImageUrl,
    header_banner_url: null,
    file_url: null, // Creator will attach a PDF in the product editor
    is_published: false, // Stays unpublished until creator finalizes in /dashboard/products
    metadata: { celestudio_ebook_id: ebook.id },
  };

  let productId: string;

  if (ebook.published_product_id) {
    // Update the existing linked product (price + description only)
    const { data: updated, error: updateErr } = await (supabase as any).from('products')
      .update({
        title: productPayload.title,
        subtitle: productPayload.subtitle,
        description: productPayload.description,
        price: productPayload.price,
        cover_image_url: productPayload.cover_image_url,
      })
      .eq('id', ebook.published_product_id)
      .eq('creator_id', user.id)
      .select('id')
      .single();
    if (updateErr || !updated) {
      console.error('Update product error:', updateErr);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
    productId = updated.id;
  } else {
    // Create a fresh product
    const { data: created, error: createErr } = await (supabase as any).from('products')
      .insert(productPayload)
      .select('id')
      .single();
    if (createErr || !created) {
      console.error('Create product error:', createErr);
      return NextResponse.json({ error: `Failed to create product: ${createErr?.message ?? 'unknown'}` }, { status: 500 });
    }
    productId = created.id;
  }

  // Link the ebook to the product
  await (supabase as any).from('celestudio_ebooks')
    .update({
      published_product_id: productId,
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('creator_id', user.id);

  return NextResponse.json({
    product: { id: productId },
    message: 'Product created. Finalize in your products page (add the PDF file, then publish).',
  });
}

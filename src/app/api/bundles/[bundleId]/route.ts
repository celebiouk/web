import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateBundleSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  price_cents: z.number().int().positive().optional(),
  is_published: z.boolean().optional(),
  show_on_storefront: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bundleId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bundleId } = await params;
    const body = updateBundleSchema.parse(await request.json());

    const { data, error } = await (supabase.from('bundles') as any)
      .update(body)
      .eq('id', bundleId)
      .eq('creator_id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
    }

    return NextResponse.json({ bundle: data });
  } catch (error) {
    console.error('Bundles PATCH error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

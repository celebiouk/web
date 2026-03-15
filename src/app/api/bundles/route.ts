import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const createBundleSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  cover_image_url: z.string().url().optional(),
  price_cents: z.number().int().positive(),
  product_ids: z.array(z.string().uuid()).min(2),
  is_published: z.boolean().default(false),
  show_on_storefront: z.boolean().default(true),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: bundles } = await (supabase.from('bundles') as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    const bundleIds = (bundles || []).map((bundle: { id: string }) => bundle.id);
    const { data: bundleProducts } = bundleIds.length
      ? await (supabase.from('bundle_products') as any)
          .select('bundle_id, product_id, position, products(id,title,price,type)')
          .in('bundle_id', bundleIds)
          .order('position', { ascending: true })
      : { data: [] as any[] };

    return NextResponse.json({ bundles: bundles || [], bundleProducts: bundleProducts || [] });
  } catch (error) {
    console.error('Bundles GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = createBundleSchema.parse(await request.json());

    const { data: products, error: productsError } = await (supabase.from('products') as any)
      .select('id,price')
      .eq('creator_id', user.id)
      .in('id', body.product_ids);

    if (productsError || !products?.length || products.length !== body.product_ids.length) {
      return NextResponse.json({ error: 'Invalid product selection' }, { status: 400 });
    }

    const originalValue = products.reduce((sum: number, product: { price: number }) => sum + product.price, 0);
    if (body.price_cents >= originalValue) {
      return NextResponse.json({ error: 'Bundle price must be lower than original total' }, { status: 400 });
    }

    const { data: bundle, error: bundleError } = await (supabase.from('bundles') as any)
      .insert({
        creator_id: user.id,
        title: body.title,
        description: body.description || null,
        cover_image_url: body.cover_image_url || null,
        price_cents: body.price_cents,
        original_value_cents: originalValue,
        is_published: body.is_published,
        show_on_storefront: body.show_on_storefront,
      })
      .select('*')
      .single();

    if (bundleError || !bundle) {
      return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
    }

    await (supabase.from('bundle_products') as any)
      .insert(body.product_ids.map((productId, index) => ({
        bundle_id: bundle.id,
        product_id: productId,
        position: index,
      })));

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error('Bundles POST error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

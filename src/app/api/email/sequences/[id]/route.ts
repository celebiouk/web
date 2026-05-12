import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  trigger: z.enum(['new_subscriber', 'product_purchase', 'course_enrollment', 'booking']).optional(),
  trigger_product_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: sequence } = await (supabase as any)
    .from('email_sequences')
    .select('*')
    .eq('id', params.id)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (!sequence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: steps } = await (supabase as any)
    .from('email_sequence_steps')
    .select('*')
    .eq('sequence_id', params.id)
    .order('position', { ascending: true });

  // Products list so the UI can populate the trigger_product_id dropdown.
  const { data: products } = await (supabase as any)
    .from('products')
    .select('id,title,price_cents')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({
    sequence,
    steps: steps ?? [],
    products: products ?? [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.trigger !== undefined) patch.trigger = body.trigger;
  if (body.trigger_product_id !== undefined) patch.trigger_product_id = body.trigger_product_id;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error } = await (supabase as any)
    .from('email_sequences')
    .update(patch)
    .eq('id', params.id)
    .eq('creator_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateSchema = z.object({
  delay_days: z.number().int().min(0).max(365).optional(),
  send_at_hour: z.number().int().min(0).max(23).optional(),
  send_at_minute: z.number().int().min(0).max(59).optional(),
  subject: z.string().min(1).max(180).optional(),
  body_html: z.string().min(1).optional(),
});

async function getSequence(supabase: Awaited<ReturnType<typeof createClient>>, id: string, userId: string) {
  const { data } = await (supabase as any)
    .from('email_sequences')
    .select('id')
    .eq('id', id)
    .eq('creator_id', userId)
    .maybeSingle();
  return data;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; position: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await getSequence(supabase, params.id, user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from('email_sequence_steps')
    .update(body)
    .eq('sequence_id', params.id)
    .eq('position', Number(params.position));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; position: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await getSequence(supabase, params.id, user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pos = Number(params.position);

  // Delete the step, then compact positions so there are no gaps.
  await (supabase as any)
    .from('email_sequence_steps')
    .delete()
    .eq('sequence_id', params.id)
    .eq('position', pos);

  // Re-number steps with position > deleted one.
  const { data: later } = await (supabase as any)
    .from('email_sequence_steps')
    .select('id,position')
    .eq('sequence_id', params.id)
    .gt('position', pos)
    .order('position', { ascending: true });

  for (const step of (later ?? [])) {
    await (supabase as any)
      .from('email_sequence_steps')
      .update({ position: step.position - 1 })
      .eq('id', step.id);
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const stepSchema = z.object({
  position: z.number().int().min(0),
  delay_days: z.number().int().min(0).max(365),
  send_at_hour: z.number().int().min(0).max(23).default(9),
  send_at_minute: z.number().int().min(0).max(59).default(0),
  subject: z.string().min(1).max(180),
  body_html: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: sequence } = await (supabase as any)
    .from('email_sequences')
    .select('id')
    .eq('id', params.id)
    .eq('creator_id', user.id)
    .maybeSingle();
  if (!sequence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body;
  try {
    body = stepSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from('email_sequence_steps')
    .insert({ ...body, sequence_id: params.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

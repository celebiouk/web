import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const stepSchema = z.object({
  position: z.number().int().min(0),
  delay_days: z.number().int().min(0).max(365),
  subject: z.string().min(1).max(180),
  body_html: z.string().min(1),
});

const createSequenceSchema = z.object({
  name: z.string().min(2).max(120),
  trigger: z.enum(['new_subscriber', 'product_purchase', 'course_enrollment', 'booking']),
  trigger_product_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
  steps: z.array(stepSchema).min(1),
});

const updateSequenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  trigger: z.enum(['new_subscriber', 'product_purchase', 'course_enrollment', 'booking']).optional(),
  trigger_product_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  steps: z.array(stepSchema).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: sequences } = await (supabase.from('email_sequences') as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    const sequenceIds = (sequences || []).map((s: { id: string }) => s.id);
    const { data: steps } = sequenceIds.length
      ? await (supabase.from('email_sequence_steps') as any)
        .select('*')
        .in('sequence_id', sequenceIds)
        .order('position', { ascending: true })
      : { data: [] as any[] };

    return NextResponse.json({ sequences: sequences || [], steps: steps || [] });
  } catch (error) {
    console.error('Sequences GET error:', error);
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

    const body = createSequenceSchema.parse(await request.json());

    const { data: sequence, error: seqError } = await (supabase.from('email_sequences') as any)
      .insert({
        creator_id: user.id,
        name: body.name,
        trigger: body.trigger,
        trigger_product_id: body.trigger_product_id || null,
        is_active: body.is_active,
      })
      .select('*')
      .single();

    if (seqError || !sequence) {
      return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 });
    }

    await (supabase.from('email_sequence_steps') as any)
      .insert(body.steps.map((step) => ({ ...step, sequence_id: sequence.id })));

    return NextResponse.json({ sequenceId: sequence.id });
  } catch (error) {
    console.error('Sequences POST error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = updateSequenceSchema.parse(await request.json());

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.trigger !== undefined) updatePayload.trigger = body.trigger;
    if (body.trigger_product_id !== undefined) updatePayload.trigger_product_id = body.trigger_product_id;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

    if (Object.keys(updatePayload).length > 0) {
      await (supabase.from('email_sequences') as any)
        .update(updatePayload)
        .eq('id', body.id)
        .eq('creator_id', user.id);
    }

    if (body.steps) {
      await (supabase.from('email_sequence_steps') as any).delete().eq('sequence_id', body.id);
      await (supabase.from('email_sequence_steps') as any)
        .insert(body.steps.map((step) => ({ ...step, sequence_id: body.id })));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sequences PUT error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

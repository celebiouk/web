import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const createBroadcastSchema = z.object({
  subject: z.string().min(3).max(180),
  preview_text: z.string().max(300).optional(),
  body_html: z.string().min(1),
  segment: z.object({
    type: z.enum(['all', 'tag', 'product', 'course_students', 'buyers', 'platform_users', 'platform_pro', 'platform_free', 'platform_subscribers']),
    value: z.string().optional(),
  }),
  status: z.enum(['draft', 'scheduled']).default('draft'),
  scheduled_at: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await (supabase.from('email_broadcasts') as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to load broadcasts' }, { status: 500 });
    }

    return NextResponse.json({ broadcasts: data || [] });
  } catch (error) {
    console.error('Broadcasts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = createBroadcastSchema.parse(await request.json());

    const { data, error } = await (supabase.from('email_broadcasts') as any)
      .insert({
        creator_id: user.id,
        subject: body.subject,
        preview_text: body.preview_text || null,
        body_html: body.body_html,
        segment: body.segment,
        status: body.status,
        scheduled_at: body.scheduled_at || null,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
    }

    return NextResponse.json({ broadcast: data });
  } catch (error) {
    console.error('Broadcasts POST error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

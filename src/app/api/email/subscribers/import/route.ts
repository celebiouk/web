import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const importSchema = z.object({
  rows: z.array(z.object({
    email: z.string().email(),
    first_name: z.string().optional(),
  })).min(1),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = importSchema.parse(await request.json());

    const payload = body.rows.map((row) => ({
      creator_id: user.id,
      email: row.email.toLowerCase(),
      first_name: row.first_name || null,
      name: row.first_name || null,
      source: body.source || 'import',
      tags: ['Imported'],
      is_active: true,
    }));

    const { error } = await (supabase.from('email_subscribers') as any)
      .upsert(payload, { onConflict: 'creator_id,email' });

    if (error) {
      return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, imported: payload.length });
  } catch (error) {
    console.error('Import subscribers error:', error);
    return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 });
  }
}

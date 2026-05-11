import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin', 'threads', 'facebook']),
  account_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = schema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request', detail: err instanceof Error ? err.message : 'Bad input' },
      { status: 400 }
    );
  }

  // If no account_id supplied, disconnect all of the user's accounts on that platform.
  // RLS on social_accounts already restricts to auth.uid() = creator_id, so we
  // don't need belt-and-suspenders on creator_id — but include it anyway for
  // service-client safety in case this route ever moves to admin.
  let query = (supabase as any)
    .from('social_accounts')
    .delete()
    .eq('creator_id', user.id)
    .eq('platform', body.platform);
  if (body.account_id) query = query.eq('id', body.account_id);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

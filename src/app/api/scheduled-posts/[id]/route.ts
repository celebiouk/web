import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only cancel future, not-yet-published posts. Once a post is 'posting' or
  // 'posted', cancelling is meaningless.
  const { data: existing } = await (supabase as any)
    .from('scheduled_posts')
    .select('id,status,creator_id')
    .eq('id', id)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'posted' || existing.status === 'posting') {
    return NextResponse.json({ error: 'Cannot cancel — already publishing' }, { status: 409 });
  }

  const { error } = await (supabase as any)
    .from('scheduled_posts')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('creator_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await (supabase.from('instagram_connections') as any)
    .select('ig_username, page_name, created_at')
    .eq('creator_id', user.id)
    .maybeSingle();

  return NextResponse.json({ connection: data ?? null });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await (supabase.from('instagram_connections') as any)
    .delete()
    .eq('creator_id', user.id);

  return NextResponse.json({ success: true });
}

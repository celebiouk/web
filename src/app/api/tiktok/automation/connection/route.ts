import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await (supabase as any).from('tiktok_automation_connections')
    .select('tiktok_username, tiktok_open_id, created_at')
    .eq('creator_id', user.id)
    .maybeSingle();

  return NextResponse.json({ connection: data ?? null });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await (supabase as any).from('tiktok_automation_connections')
    .delete()
    .eq('creator_id', user.id);

  return NextResponse.json({ success: true });
}

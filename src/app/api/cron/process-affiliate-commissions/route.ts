import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    const { data: pending } = await (supabase.from('affiliate_conversions') as any)
      .select('id')
      .eq('status', 'pending')
      .lte('release_at', new Date().toISOString())
      .limit(500);

    const ids = (pending || []).map((row: { id: string }) => row.id);

    if (ids.length) {
      await (supabase.from('affiliate_conversions') as any)
        .update({ status: 'approved' })
        .in('id', ids);
    }

    return NextResponse.json({ success: true, approved: ids.length });
  } catch (error) {
    console.error('Process affiliate commissions cron error:', error);
    return NextResponse.json({ error: 'Failed to process affiliate commissions' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ensureUpgradeNudge } from '@/lib/nudges';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    const { data: freeProfiles } = await (supabase.from('profiles') as any)
      .select('id,subscription_tier')
      .eq('subscription_tier', 'free')
      .limit(1000);

    let nudgesCreated = 0;

    for (const profile of freeProfiles || []) {
      const { count } = await (supabase.from('email_subscribers') as any)
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', profile.id)
        .eq('is_active', true);

      if ((count || 0) >= 400) {
        await ensureUpgradeNudge(supabase as any, profile.id, 'email_limit_warning');
        nudgesCreated += 1;
      }
    }

    return NextResponse.json({ success: true, nudgesCreated });
  } catch (error) {
    console.error('Send upgrade nudges cron error:', error);
    return NextResponse.json({ error: 'Failed to process upgrade nudges' }, { status: 500 });
  }
}

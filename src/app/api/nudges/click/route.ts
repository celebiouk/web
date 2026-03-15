import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { markUpgradeNudgeClicked, type UpgradeNudgeType } from '@/lib/nudges';

const bodySchema = z.object({
  nudgeType: z.enum(['first_sale', 'third_sale', 'fourth_product_attempt', 'email_limit_warning']),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    await markUpgradeNudgeClicked(serviceSupabase, user.id, body.nudgeType as UpgradeNudgeType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Nudge click tracking error:', error);
    return NextResponse.json({ error: 'Failed to track nudge click' }, { status: 500 });
  }
}

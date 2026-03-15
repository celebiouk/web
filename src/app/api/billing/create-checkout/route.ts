import { NextResponse } from 'next/server';
import { z } from 'zod';
import { APP_URL } from '@/lib/constants';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createOrUpdateCustomer, createSubscriptionCheckoutSession } from '@/lib/stripe';
import { markUpgradeNudgeClicked, type UpgradeNudgeType } from '@/lib/nudges';

const bodySchema = z.object({
  plan: z.enum(['pro_monthly', 'pro_yearly']),
  nudgeType: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('id, full_name, stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single();

    const profile = profileRaw as {
      id: string;
      full_name: string | null;
      stripe_customer_id: string | null;
      subscription_tier: 'free' | 'pro';
    } | null;

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const priceId = body.plan === 'pro_monthly'
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      : process.env.STRIPE_PRO_YEARLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Billing price is not configured' }, { status: 500 });
    }

    const customer = await createOrUpdateCustomer({
      existingCustomerId: profile.stripe_customer_id,
      email: user.email,
      name: profile.full_name,
      metadata: { user_id: user.id },
    });

    await (serviceSupabase.from('profiles') as any)
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id);

    if (body.nudgeType) {
      await markUpgradeNudgeClicked(serviceSupabase, user.id, body.nudgeType as UpgradeNudgeType);
    }

    const session = await createSubscriptionCheckoutSession({
      customerId: customer.id,
      customerEmail: user.email,
      priceId,
      userId: user.id,
      successUrl: `${APP_URL}/dashboard/settings/billing?success=true`,
      cancelUrl: `${APP_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create billing checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

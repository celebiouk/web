import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { retrieveSubscription, switchSubscriptionPrice } from '@/lib/stripe';

const bodySchema = z.object({
  plan: z.enum(['pro_monthly', 'pro_yearly']),
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

    const body = bodySchema.parse(await request.json());
    const nextPriceId = body.plan === 'pro_monthly'
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      : process.env.STRIPE_PRO_YEARLY_PRICE_ID;

    if (!nextPriceId) {
      return NextResponse.json({ error: 'Billing price is not configured' }, { status: 500 });
    }

    const { data: subscriptionRaw } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, plan, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const subscription = subscriptionRaw as {
      stripe_subscription_id: string | null;
      plan: 'free' | 'pro_monthly' | 'pro_yearly';
      status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    } | null;

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (subscription.plan === body.plan) {
      return NextResponse.json({ error: 'You are already on that plan' }, { status: 400 });
    }

    const stripeSubscription = await retrieveSubscription(subscription.stripe_subscription_id);
    const subscriptionItemId = stripeSubscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 400 });
    }

    await switchSubscriptionPrice({
      subscriptionId: stripeSubscription.id,
      subscriptionItemId,
      newPriceId: nextPriceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Switch plan error:', error);
    return NextResponse.json({ error: 'Failed to switch plan' }, { status: 500 });
  }
}

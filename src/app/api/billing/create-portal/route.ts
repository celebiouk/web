import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBillingPortalSession } from '@/lib/stripe';
import { APP_URL } from '@/lib/constants';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const profile = profileRaw as { stripe_customer_id: string | null } | null;

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const portal = await createBillingPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL || `${APP_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 });
  }
}

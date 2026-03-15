import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { calculatePlatformFee, createConnectPaymentIntent } from '@/lib/stripe';

function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bundleId, buyerEmail } = body as { bundleId?: string; buyerEmail?: string };

    if (!bundleId || !buyerEmail) {
      return NextResponse.json({ error: 'bundleId and buyerEmail are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: bundle } = await (supabase.from('bundles') as any)
      .select('id,creator_id,price_cents,is_published')
      .eq('id', bundleId)
      .eq('is_published', true)
      .single();

    if (!bundle?.id) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    const { data: creator } = await (supabase.from('profiles') as any)
      .select('stripe_account_id,subscription_tier')
      .eq('id', bundle.creator_id)
      .single();

    if (!creator?.stripe_account_id) {
      return NextResponse.json({ error: 'Creator has not set up payments' }, { status: 400 });
    }

    const platformFee = calculatePlatformFee(bundle.price_cents, creator.subscription_tier || 'free');

    const paymentIntent = await createConnectPaymentIntent({
      amountCents: bundle.price_cents,
      creatorStripeAccountId: creator.stripe_account_id,
      platformFeeCents: platformFee,
      metadata: {
        type: 'bundle',
        bundle_id: bundle.id,
        creator_id: bundle.creator_id,
        buyer_email: buyerEmail,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Create bundle payment intent error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}

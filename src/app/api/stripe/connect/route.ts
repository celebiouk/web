/**
 * Stripe Connect OAuth Initiation
 * POST /api/stripe/connect
 * 
 * Creates a Stripe Express account and returns the onboarding URL
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, createAccountLink } from '@/lib/stripe';
import { APP_URL } from '@/lib/constants';
import type { Profile } from '@/types/supabase';
import { isStripeCountry, normalizeCountryCode } from '@/lib/payout-routing';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, full_name, payout_country_code')
      .eq('id', user.id)
      .single();

    const profile = data as (Pick<Profile, 'stripe_account_id' | 'stripe_account_status' | 'full_name'> & {
      payout_country_code?: string | null;
    }) | null;

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    let accountId = profile.stripe_account_id;

    // If account already exists, just create a new onboarding link
    if (accountId) {
      const accountLink = await createAccountLink(
        accountId,
        `${APP_URL}/api/stripe/connect/refresh`,
        `${APP_URL}/dashboard/settings/payments?connected=true`
      );
      
      return NextResponse.json({ url: accountLink.url });
    }

    const payoutCountryCode = normalizeCountryCode(profile.payout_country_code);
    if (!payoutCountryCode) {
      return NextResponse.json(
        { error: 'Set your payout country first in Payment Settings before connecting Stripe.' },
        { status: 400 }
      );
    }

    if (!isStripeCountry(payoutCountryCode)) {
      return NextResponse.json(
        { error: `Stripe onboarding is not available for ${payoutCountryCode}. Use the payout bank details route shown in Payment Settings.` },
        { status: 400 }
      );
    }

    // Create new Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: payoutCountryCode,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        cele_bio_user_id: user.id,
      },
    });

    // Save account ID to profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save Stripe account ID:', updateError);
      // Continue anyway - the callback will retry
    }

    // Create account onboarding link
    const accountLink = await createAccountLink(
      account.id,
      `${APP_URL}/api/stripe/connect/refresh`,
      `${APP_URL}/dashboard/settings/payments?connected=true`
    );

    return NextResponse.json({ url: accountLink.url });

  } catch (error) {
    console.error('Stripe Connect error:', error);

    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message || '')
        : '';

    return NextResponse.json(
      { error: errorMessage || 'Failed to initiate Stripe Connect' },
      { status: 500 }
    );
  }
}

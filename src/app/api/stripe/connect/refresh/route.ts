/**
 * Stripe Connect Refresh/Retry
 * GET /api/stripe/connect/refresh
 * 
 * Creates a new account link when user needs to continue onboarding
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAccountLink } from '@/lib/stripe';
import { APP_URL } from '@/lib/constants';
import type { Profile } from '@/types/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect(`${APP_URL}/login`);
    }

    // Get user profile with Stripe account ID
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();
    const profile = data as Pick<Profile, 'stripe_account_id'> | null;

    if (profileError || !profile?.stripe_account_id) {
      return NextResponse.redirect(
        `${APP_URL}/dashboard/settings/payments?error=no_account`
      );
    }

    // Create new account link
    const accountLink = await createAccountLink(
      profile.stripe_account_id,
      `${APP_URL}/api/stripe/connect/refresh`,
      `${APP_URL}/dashboard/settings/payments?connected=true`
    );

    return NextResponse.redirect(accountLink.url);

  } catch (error) {
    console.error('Stripe Connect refresh error:', error);
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings/payments?error=refresh_failed`
    );
  }
}

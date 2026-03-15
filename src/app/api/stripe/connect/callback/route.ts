/**
 * Stripe Connect OAuth Callback
 * GET /api/stripe/connect/callback
 * 
 * Handles return from Stripe Express onboarding
 * Updates account status and redirects to dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAccountOnboardingComplete } from '@/lib/stripe';
import { APP_URL } from '@/lib/constants';
import type { Profile, ProfileUpdate, StripeAccountStatus } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect(
        `${APP_URL}/login?error=unauthorized`
      );
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

    // Check if onboarding is complete
    const isComplete = await isAccountOnboardingComplete(profile.stripe_account_id);
    
    const newStatus: StripeAccountStatus = isComplete ? 'complete' : 'pending';

    // Update account status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({
        stripe_account_status: newStatus,
      })
      .eq('id', user.id);

    // Redirect to payments page with success state
    const redirectUrl = new URL(`${APP_URL}/dashboard/settings/payments`);
    redirectUrl.searchParams.set('connected', isComplete ? 'true' : 'pending');
    
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings/payments?error=callback_failed`
    );
  }
}

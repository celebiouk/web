/**
 * Stripe Express Dashboard Link
 * GET /api/stripe/dashboard
 * 
 * Returns a login link to the Stripe Express dashboard
 * for creators to manage their payouts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLoginLink } from '@/lib/stripe';
import type { Profile } from '@/types/supabase';

export async function GET() {
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

    // Get user profile with Stripe account ID
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', user.id)
      .single();
    const profile = data as Pick<Profile, 'stripe_account_id' | 'stripe_account_status'> | null;

    if (profileError || !profile?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      );
    }

    if (profile.stripe_account_status !== 'complete') {
      return NextResponse.json(
        { error: 'Stripe account setup not complete' },
        { status: 400 }
      );
    }

    // Create login link
    const loginLink = await createLoginLink(profile.stripe_account_id);

    return NextResponse.json({ url: loginLink.url });

  } catch (error) {
    console.error('Stripe dashboard link error:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    );
  }
}

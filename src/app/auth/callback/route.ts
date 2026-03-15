import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

/**
 * Auth callback handler for:
 * 1. OAuth providers (Google, TikTok) - uses 'code' parameter
 * 2. Email confirmation/magic links - uses 'token_hash' parameter
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  // Handle email confirmation (signup, password reset, etc.)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Password reset - redirect to reset page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      // Email verified successfully, redirect to onboarding
      return NextResponse.redirect(`${origin}/onboarding/pick-template`);
    }
    
    // Verification failed
    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  // Handle OAuth callback
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, username')
          .eq('id', user.id)
          .single<{ onboarding_completed: boolean | null; username: string | null }>();

        // If onboarding is complete, respect the original redirect or go to dashboard
        if (profile && profile.onboarding_completed && profile.username) {
          const finalRedirect = next.startsWith('/onboarding') ? '/dashboard' : next;
          return NextResponse.redirect(`${origin}${finalRedirect}`);
        }
      }
      
      // New user or incomplete onboarding - go to onboarding
      return NextResponse.redirect(`${origin}/onboarding/pick-template`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

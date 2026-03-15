import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth callback handler for OAuth providers (Google, TikTok)
 * Supabase redirects here after successful OAuth authentication
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, username')
          .eq('id', user.id)
          .single();

        // If onboarding is complete, respect the original redirect or go to dashboard
        if (profile?.onboarding_completed && profile?.username) {
          // Don't redirect to onboarding if already completed
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

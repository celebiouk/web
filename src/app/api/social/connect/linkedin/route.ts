import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// LinkedIn OAuth 2.0 scopes for posting to a member's feed.
// - openid/profile/email: identify the user (OIDC)
// - w_member_social: post on the member's behalf
const SCOPES = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/dashboard/schedule`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/dashboard/schedule?error=linkedin_not_configured`);
  }

  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI?.trim() ||
    `${origin}/api/social/callback/linkedin`;

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    nonce: crypto.randomUUID(),
  })).toString('base64url');

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });
  return response;
}

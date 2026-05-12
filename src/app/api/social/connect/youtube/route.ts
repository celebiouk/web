import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// YouTube Data API v3 scopes:
//  - openid/profile/email: Google OIDC identity
//  - youtube.upload: post videos / Shorts on the channel's behalf
//  - youtube.readonly: read channel info for display + metrics
const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/dashboard/schedule`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/dashboard/schedule?error=youtube_not_configured`);
  }

  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    `${origin}/api/social/callback/youtube`;

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    nonce: crypto.randomUUID(),
  })).toString('base64url');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  // access_type=offline gets us a refresh token.
  // prompt=consent forces Google to show the consent screen and return a
  // refresh token even if the user has previously authorized this app.
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  const response = NextResponse.redirect(url.toString());
  response.cookies.set('youtube_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });
  return response;
}

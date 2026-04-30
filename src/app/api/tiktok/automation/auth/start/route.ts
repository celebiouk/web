import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Scopes needed for comment automation (separate from login scopes)
const AUTOMATION_SCOPES = 'user.info.basic,video.list,comment.list,comment.create';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_ID;
  if (!clientKey) {
    return NextResponse.redirect(`${origin}/dashboard/tiktok-automation?error=not_configured`);
  }

  const redirectUri =
    process.env.TIKTOK_AUTOMATION_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/automation/auth/callback`;

  const state = Buffer.from(
    JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })
  ).toString('base64url');

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.set('client_key', clientKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', AUTOMATION_SCOPES);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set('tiktok_auto_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}

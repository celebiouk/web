import { NextResponse } from 'next/server';
import { getTikTokOAuthScope, getTikTokRedirectUri } from '@/lib/integrations/tiktok-oauth';

function safeRedirectPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith('/')) return '/dashboard';
  return nextParam;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeRedirectPath(searchParams.get('next'));

  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = getTikTokRedirectUri(request.url);
  const scope = getTikTokOAuthScope();

  if (!clientKey) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_not_configured`);
  }

  const statePayload = JSON.stringify({
    nonce: crypto.randomUUID(),
    next,
  });

  const state = Buffer.from(statePayload).toString('base64url');

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.set('client_key', clientKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}

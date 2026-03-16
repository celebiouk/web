import { NextResponse } from 'next/server';

/**
 * Compatibility callback route for CreatorLab OAuth integrations.
 *
 * If a user is redirected to cele.bio/auth/integrations/celebio/callback,
 * forward the OAuth params to the configured CreatorLab callback URI.
 */
export async function GET(request: Request) {
  const currentUrl = new URL(request.url);
  const code = currentUrl.searchParams.get('code');
  const state = currentUrl.searchParams.get('state');

  const configuredRedirect = process.env.CREATORLAB_REDIRECT_URI;

  if (!configuredRedirect) {
    return NextResponse.redirect(`${currentUrl.origin}/login?error=creatorlab_redirect_not_configured`);
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(configuredRedirect);
  } catch {
    return NextResponse.redirect(`${currentUrl.origin}/login?error=creatorlab_redirect_invalid`);
  }

  // Prevent redirect loops if this route is accidentally set as the redirect URI.
  if (targetUrl.origin === currentUrl.origin && targetUrl.pathname === currentUrl.pathname) {
    return NextResponse.redirect(`${currentUrl.origin}/login?error=creatorlab_redirect_loop`);
  }

  if (code) {
    targetUrl.searchParams.set('code', code);
  }

  if (state) {
    targetUrl.searchParams.set('state', state);
  }

  // Preserve any additional query params for debugging/compatibility.
  currentUrl.searchParams.forEach((value, key) => {
    if (key === 'code' || key === 'state') return;
    targetUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(targetUrl.toString());
}

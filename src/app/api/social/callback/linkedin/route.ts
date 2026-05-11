import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

interface LinkedInUserInfo {
  sub: string;            // The member's LinkedIn person URN id (also returned via /v2/userinfo)
  name?: string;
  picture?: string;
  email?: string;
  preferred_username?: string;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  const DASHBOARD = `${origin}/dashboard/schedule`;

  if (oauthError) {
    return NextResponse.redirect(`${DASHBOARD}?error=linkedin_access_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${DASHBOARD}?error=linkedin_invalid_callback`);
  }

  // Verify state cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const storedState = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('linkedin_oauth_state='))
    ?.split('=')?.[1]
    ?.trim();

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${DASHBOARD}?error=linkedin_state_mismatch`);
  }

  let userId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString()) as { userId?: string };
    if (!parsed.userId) throw new Error('no userId');
    userId = parsed.userId;
  } catch {
    return NextResponse.redirect(`${DASHBOARD}?error=linkedin_invalid_state`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI?.trim() ||
    `${origin}/api/social/callback/linkedin`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${DASHBOARD}?error=linkedin_not_configured`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: 'no-store',
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error('LinkedIn token exchange failed:', detail);
      return NextResponse.redirect(`${DASHBOARD}?error=linkedin_token_exchange_failed`);
    }

    const tokens = (await tokenRes.json()) as LinkedInTokenResponse;

    // 2. Fetch the member's profile via OIDC userinfo endpoint
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });

    if (!userRes.ok) {
      const detail = await userRes.text();
      console.error('LinkedIn userinfo failed:', detail);
      return NextResponse.redirect(`${DASHBOARD}?error=linkedin_userinfo_failed`);
    }

    const profile = (await userRes.json()) as LinkedInUserInfo;
    if (!profile.sub) {
      return NextResponse.redirect(`${DASHBOARD}?error=linkedin_userinfo_failed`);
    }

    // 3. Save to social_accounts (upsert on creator_id+platform+platform_user_id)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const refreshExpiresAt = tokens.refresh_token_expires_in
      ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000).toISOString()
      : null;

    const admin = await createServiceClient();
    const { error: upsertErr } = await (admin as any)
      .from('social_accounts')
      .upsert({
        creator_id: userId,
        platform: 'linkedin',
        platform_user_id: profile.sub,
        platform_username: profile.preferred_username ?? null,
        display_name: profile.name ?? null,
        avatar_url: profile.picture ?? null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        refresh_token_expires_at: refreshExpiresAt,
        scopes: (tokens.scope ?? '').split(/[\s,]+/).filter(Boolean),
        status: 'active',
        last_error: null,
        last_refreshed_at: new Date().toISOString(),
        meta: {},
      }, { onConflict: 'creator_id,platform,platform_user_id' });

    if (upsertErr) {
      console.error('LinkedIn account upsert failed:', upsertErr);
      return NextResponse.redirect(`${DASHBOARD}?error=linkedin_save_failed`);
    }

    const response = NextResponse.redirect(`${DASHBOARD}?connected=linkedin`);
    response.cookies.set('linkedin_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('LinkedIn OAuth error:', err);
    return NextResponse.redirect(`${DASHBOARD}?error=linkedin_server_error`);
  }
}

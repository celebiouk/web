import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const DASHBOARD_URL = `${origin}/dashboard/tiktok-automation`;

  if (error) return NextResponse.redirect(`${DASHBOARD_URL}?error=access_denied`);
  if (!code || !state) return NextResponse.redirect(`${DASHBOARD_URL}?error=invalid_callback`);

  // Verify state cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const storedState = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('tiktok_auto_oauth_state='))
    ?.split('=')?.[1]?.trim();

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=state_mismatch`);
  }

  let userId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    userId = parsed.userId;
    if (!userId) throw new Error('no userId');
  } catch {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=invalid_state`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_ID!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri =
    process.env.TIKTOK_AUTOMATION_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/automation/auth/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token || !tokenData.open_id) {
      console.error('TikTok token exchange failed:', tokenData);
      return NextResponse.redirect(`${DASHBOARD_URL}?error=token_exchange_failed`);
    }

    const accessToken: string = tokenData.access_token;
    const refreshToken: string | null = tokenData.refresh_token ?? null;
    const openId: string = tokenData.open_id;
    const expiresIn: number = tokenData.expires_in ?? 86400;
    const refreshExpiresIn: number = tokenData.refresh_expires_in ?? 2592000;

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000).toISOString();

    // Fetch TikTok username
    let tiktokUsername: string | null = null;
    try {
      const infoRes = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const infoData = await infoRes.json();
      tiktokUsername =
        infoData.data?.user?.username ||
        infoData.data?.user?.display_name ||
        null;
    } catch {
      // Non-fatal
    }

    const supabaseAdmin = getSupabaseAdmin();
    await (supabaseAdmin.from('tiktok_automation_connections') as any).upsert({
      creator_id: userId,
      tiktok_open_id: openId,
      tiktok_username: tiktokUsername,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
      refresh_token_expires_at: refreshExpiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'creator_id' });

    const response = NextResponse.redirect(`${DASHBOARD_URL}?connected=true`);
    response.cookies.set('tiktok_auto_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('TikTok automation OAuth error:', err);
    return NextResponse.redirect(`${DASHBOARD_URL}?error=server_error`);
  }
}

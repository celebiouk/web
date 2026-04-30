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

  const DASHBOARD_URL = `${origin}/dashboard/instagram-automation`;

  if (error) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${DASHBOARD_URL}?error=invalid_callback`);
  }

  // Verify state cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const storedState = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('ig_oauth_state='))
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

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/auth/callback`;

  try {
    // Step 1: Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(`${DASHBOARD_URL}?error=token_exchange_failed`);
    }

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();
    const userToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in;
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Step 3: Get user's Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();
    const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.redirect(`${DASHBOARD_URL}?error=no_pages`);
    }

    // Step 4: Find the page connected to an Instagram Business Account
    let igUserId: string | null = null;
    let igUsername: string | null = null;
    let pageId: string | null = null;
    let pageName: string | null = null;
    let pageAccessToken: string | null = null;

    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        igUserId = igData.instagram_business_account.id;
        pageId = page.id;
        pageName = page.name;
        pageAccessToken = page.access_token;

        // Get IG username
        const profileRes = await fetch(
          `https://graph.facebook.com/v21.0/${igUserId}?fields=username&access_token=${pageAccessToken}`
        );
        const profileData = await profileRes.json();
        igUsername = profileData.username || null;
        break;
      }
    }

    if (!igUserId || !pageAccessToken) {
      return NextResponse.redirect(`${DASHBOARD_URL}?error=no_instagram_account`);
    }

    // Step 5: Subscribe page to Instagram webhooks
    await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: ['comments', 'messages'],
          access_token: pageAccessToken,
        }),
      }
    );

    // Step 6: Save to database
    const supabaseAdmin = getSupabaseAdmin();
    await (supabaseAdmin.from('instagram_connections') as any).upsert({
      creator_id: userId,
      ig_user_id: igUserId,
      ig_username: igUsername,
      page_id: pageId,
      page_name: pageName,
      access_token: pageAccessToken,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'creator_id' });

    const response = NextResponse.redirect(`${DASHBOARD_URL}?connected=true`);
    response.cookies.set('ig_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Instagram OAuth error:', err);
    return NextResponse.redirect(`${DASHBOARD_URL}?error=server_error`);
  }
}

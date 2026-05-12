import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;           // seconds until expiry (typically 3600)
  refresh_token?: string;       // only returned on first authorization
  scope?: string;
  token_type: string;
}

interface YouTubeChannelListResponse {
  items?: Array<{
    id: string;                 // UCxxxxxxxxxxxxxxxx — the channel ID
    snippet?: {
      title?: string;
      customUrl?: string;       // @handle (with leading @)
      thumbnails?: {
        default?: { url?: string };
      };
    };
  }>;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  const DASHBOARD = `${origin}/dashboard/schedule`;

  if (oauthError) {
    return NextResponse.redirect(`${DASHBOARD}?error=youtube_access_denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${DASHBOARD}?error=youtube_invalid_callback`);
  }

  // Verify CSRF state cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const storedState = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('youtube_oauth_state='))
    ?.split('=')?.[1]
    ?.trim();

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${DASHBOARD}?error=youtube_state_mismatch`);
  }

  let userId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString()) as { userId?: string };
    if (!parsed.userId) throw new Error('no userId');
    userId = parsed.userId;
  } catch {
    return NextResponse.redirect(`${DASHBOARD}?error=youtube_invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    `${origin}/api/social/callback/youtube`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${DASHBOARD}?error=youtube_not_configured`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
      console.error('YouTube token exchange failed:', detail);
      return NextResponse.redirect(`${DASHBOARD}?error=youtube_token_exchange_failed`);
    }

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    // 2. Fetch the connected YouTube channel (mine=true uses the token identity)
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&maxResults=1',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        cache: 'no-store',
      }
    );

    if (!channelRes.ok) {
      const detail = await channelRes.text();
      console.error('YouTube channel fetch failed:', detail);
      return NextResponse.redirect(`${DASHBOARD}?error=youtube_channel_fetch_failed`);
    }

    const channelData = (await channelRes.json()) as YouTubeChannelListResponse;
    const channel = channelData.items?.[0];
    if (!channel?.id) {
      return NextResponse.redirect(`${DASHBOARD}?error=youtube_no_channel`);
    }

    const channelId = channel.id;
    const channelTitle = channel.snippet?.title ?? null;
    // customUrl is "@handle" — strip the leading @ to match our username convention
    const customUrl = channel.snippet?.customUrl ?? null;
    const handle = customUrl ? customUrl.replace(/^@/, '') : null;
    const avatarUrl = channel.snippet?.thumbnails?.default?.url ?? null;

    // 3. Upsert into social_accounts
    // Google access tokens expire after 1 hour. Refresh tokens don't expire
    // unless revoked — but we only receive them on the first authorization
    // (hence the prompt=consent in the connect route).
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const admin = await createServiceClient();
    const { error: upsertErr } = await (admin as any)
      .from('social_accounts')
      .upsert(
        {
          creator_id: userId,
          platform: 'youtube',
          platform_user_id: channelId,
          platform_username: handle,
          display_name: channelTitle,
          avatar_url: avatarUrl,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          token_expires_at: expiresAt,
          refresh_token_expires_at: null,  // Google refresh tokens don't expire
          scopes: (tokens.scope ?? '').split(/\s+/).filter(Boolean),
          status: 'active',
          last_error: null,
          last_refreshed_at: new Date().toISOString(),
          meta: { channel_id: channelId },
        },
        { onConflict: 'creator_id,platform,platform_user_id' }
      );

    if (upsertErr) {
      console.error('YouTube account upsert failed:', upsertErr);
      return NextResponse.redirect(`${DASHBOARD}?error=youtube_save_failed`);
    }

    const response = NextResponse.redirect(`${DASHBOARD}?connected=youtube`);
    response.cookies.set('youtube_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('YouTube OAuth error:', err);
    return NextResponse.redirect(`${DASHBOARD}?error=youtube_server_error`);
  }
}

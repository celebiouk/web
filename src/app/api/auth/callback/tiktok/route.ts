import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type TikTokUserInfoResponse = {
  data?: {
    user?: {
      display_name?: string;
      avatar_url?: string;
      avatar_url_100?: string;
      avatar_url_200?: string;
      avatar_large_url?: string;
      profile_image?: string;
      [key: string]: unknown;
    };
  };
};

type TikTokTokenResponse = {
  access_token?: string;
  open_id?: string;
};

function safeRedirectPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith('/')) return '/dashboard';
  return nextParam;
}

function resolveProfileFields(user: {
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata || {};

  const displayName = [
    metadata.display_name,
    metadata.full_name,
    metadata.name,
    metadata.preferred_username,
  ].find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined;

  const avatarUrl = [
    metadata.avatar_url,
    metadata.picture,
    metadata.avatar,
    metadata.profile_image,
  ].find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined;

  return {
    displayName: displayName?.trim() || null,
    avatarUrl: avatarUrl?.trim() || null,
  };
}

async function fetchTikTokUserInfo(accessToken: string) {
  const pickAvatar = (user?: Record<string, unknown>) => {
    if (!user) {
      return null;
    }

    const candidates = [
      user.avatar_url,
      user.avatar_url_200,
      user.avatar_url_100,
      user.avatar_large_url,
      user.profile_image,
      user.avatar,
      user.picture,
    ];

    const firstString = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return typeof firstString === 'string' ? firstString.trim() : null;
  };

  try {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,avatar_url_100,avatar_url_200,avatar_large_url,profile_image',
      {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
      }
    );

    if (!response.ok) {
      return { displayName: null, avatarUrl: null };
    }

    const payload = (await response.json()) as TikTokUserInfoResponse;
    const user = payload.data?.user as Record<string, unknown> | undefined;
    return {
      displayName: payload.data?.user?.display_name?.trim() || null,
      avatarUrl: pickAvatar(user),
    };
  } catch {
    return { displayName: null, avatarUrl: null };
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const next = safeRedirectPath(searchParams.get('next'));

  const redirectUri = `${origin}/api/auth/callback/tiktok`;
  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!code || !state || !clientKey || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  const cookieStore = (await import('next/headers')).cookies;
  const cookies = await cookieStore();
  const expectedState = cookies.get('tiktok_oauth_state')?.value;

  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  let decodedNext = next;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { next?: string };
    if (parsed.next && parsed.next.startsWith('/')) {
      decodedNext = parsed.next;
    }
  } catch {
    decodedNext = next;
  }

  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  const tokenPayload = (await tokenResponse.json()) as TikTokTokenResponse;
  const accessToken = tokenPayload.access_token;
  const openId = tokenPayload.open_id;

  if (!accessToken || !openId) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  const syntheticEmail = `tiktok_${openId}@celebio.local`;
  const derivedPassword = `Tk!${crypto.createHash('sha256').update(`${openId}:${clientSecret}`).digest('hex').slice(0, 40)}`;

  const admin = await createServiceClient();
  const createResult = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password: derivedPassword,
    email_confirm: true,
    user_metadata: {
      provider: 'tiktok',
      tiktok_open_id: openId,
    },
  });

  const createErrorMessage = (createResult.error?.message || '').toLowerCase();
  if (createResult.error && !createErrorMessage.includes('already') && !createErrorMessage.includes('registered')) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: derivedPassword,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  const user = signInData.user;

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=tiktok_auth_failed`);
  }

  const metadataFallback = resolveProfileFields(user as { user_metadata?: Record<string, unknown> });
  const providerProfile = await fetchTikTokUserInfo(accessToken);

  const finalDisplayName = providerProfile.displayName || metadataFallback.displayName;
  const finalAvatarUrl = providerProfile.avatarUrl || metadataFallback.avatarUrl;

  const { data: existingProfile } = await (supabase.from('profiles') as any)
    .select('full_name,avatar_url,onboarding_completed,username')
    .eq('id', user.id)
    .maybeSingle();

  const updates: Record<string, string> = {};

  if (!existingProfile?.full_name && finalDisplayName) {
    updates.full_name = finalDisplayName;
  }

  if (!existingProfile?.avatar_url && finalAvatarUrl) {
    updates.avatar_url = finalAvatarUrl;
  }

  if (Object.keys(updates).length > 0) {
    await (supabase.from('profiles') as any)
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' });
  }

  const clearState = NextResponse.redirect(`${origin}${decodedNext}`);
  clearState.cookies.set('tiktok_oauth_state', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });

  if (existingProfile?.onboarding_completed && existingProfile?.username) {
    const finalRedirect = decodedNext.startsWith('/onboarding') ? '/dashboard' : decodedNext;
    clearState.headers.set('location', `${origin}${finalRedirect}`);
    return clearState;
  }

  clearState.headers.set('location', `${origin}/onboarding/pick-template`);
  return clearState;
}

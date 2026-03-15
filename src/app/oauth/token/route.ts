import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { buildCreatorLabTokenResponse, generateOpaqueToken, sha256 } from '@/lib/integrations/creatorlab/auth';
import { getCreatorLabOAuthConfig, isAllowedRedirectUri } from '@/lib/integrations/creatorlab/config';

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function parseTokenRequestBody(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
  }

  const json = await request.json().catch(() => ({}));
  return Object.fromEntries(Object.entries(json as Record<string, unknown>).map(([key, value]) => [key, String(value ?? '')]));
}

export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || randomUUID();

  try {
    const body = await parseTokenRequestBody(request);
    const grantType = body.grant_type || '';
    const clientId = body.client_id || '';
    const clientSecret = body.client_secret || '';

    const oauthConfig = getCreatorLabOAuthConfig();
    if (clientId !== oauthConfig.clientId || clientSecret !== oauthConfig.clientSecret) {
      return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
    }

    const admin = getAdminClient() as any;

    if (grantType === 'authorization_code') {
      const code = body.code || '';
      const redirectUri = body.redirect_uri || '';

      if (!code || !redirectUri || !isAllowedRedirectUri(redirectUri, oauthConfig)) {
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
      }

      const codeHash = sha256(code);
      const { data: codeRow } = await admin
        .from('creatorlab_oauth_codes')
        .select('*')
        .eq('code_hash', codeHash)
        .is('consumed_at', null)
        .maybeSingle();

      if (!codeRow || new Date(codeRow.expires_at).getTime() <= Date.now()) {
        return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
      }

      if (codeRow.client_id !== clientId || codeRow.redirect_uri !== redirectUri) {
        return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
      }

      const accessToken = generateOpaqueToken(32);
      const refreshToken = generateOpaqueToken(32);
      const now = Date.now();
      const expiresInSeconds = 3600;

      await admin
        .from('creatorlab_oauth_codes')
        .update({ consumed_at: new Date(now).toISOString() })
        .eq('id', codeRow.id);

      await admin.from('creatorlab_oauth_tokens').insert({
        access_token_hash: sha256(accessToken),
        refresh_token_hash: sha256(refreshToken),
        client_id: clientId,
        account_id: codeRow.account_id,
        username: codeRow.username,
        scope: codeRow.scope,
        expires_at: new Date(now + expiresInSeconds * 1000).toISOString(),
        refresh_expires_at: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      console.info(
        JSON.stringify({
          event: 'creatorlab.oauth.token.exchanged',
          correlation_id: correlationId,
          account_id: codeRow.account_id,
        })
      );

      return NextResponse.json(
        buildCreatorLabTokenResponse({
          accessToken,
          refreshToken,
          expiresIn: expiresInSeconds,
          scope: codeRow.scope,
          account: {
            id: codeRow.account_id,
            username: codeRow.username,
          },
        })
      );
    }

    if (grantType === 'refresh_token') {
      const refreshToken = body.refresh_token || '';
      if (!refreshToken) {
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
      }

      const refreshTokenHash = sha256(refreshToken);
      const { data: tokenRow } = await admin
        .from('creatorlab_oauth_tokens')
        .select('*')
        .eq('refresh_token_hash', refreshTokenHash)
        .is('revoked_at', null)
        .maybeSingle();

      if (!tokenRow || new Date(tokenRow.refresh_expires_at).getTime() <= Date.now()) {
        return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
      }

      const nextAccessToken = generateOpaqueToken(32);
      const nextRefreshToken = generateOpaqueToken(32);
      const now = Date.now();
      const expiresInSeconds = 3600;

      await admin
        .from('creatorlab_oauth_tokens')
        .update({ revoked_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString() })
        .eq('id', tokenRow.id);

      await admin.from('creatorlab_oauth_tokens').insert({
        access_token_hash: sha256(nextAccessToken),
        refresh_token_hash: sha256(nextRefreshToken),
        client_id: tokenRow.client_id,
        account_id: tokenRow.account_id,
        username: tokenRow.username,
        scope: tokenRow.scope,
        expires_at: new Date(now + expiresInSeconds * 1000).toISOString(),
        refresh_expires_at: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      console.info(
        JSON.stringify({
          event: 'creatorlab.oauth.token.refreshed',
          correlation_id: correlationId,
          account_id: tokenRow.account_id,
        })
      );

      return NextResponse.json(
        buildCreatorLabTokenResponse({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          expiresIn: expiresInSeconds,
          scope: tokenRow.scope,
          account: {
            id: tokenRow.account_id,
            username: tokenRow.username,
          },
        })
      );
    }

    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'creatorlab.oauth.token.failed',
        correlation_id: correlationId,
        error: error instanceof Error ? error.message : 'unknown_error',
      })
    );
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 500 });
  }
}

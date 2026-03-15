import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { generateOpaqueToken, sha256 } from '@/lib/integrations/creatorlab/auth';
import {
  getCreatorLabOAuthConfig,
  isAllowedRedirectUri,
  normalizeScopes,
  parseScopeString,
  validateScopes,
} from '@/lib/integrations/creatorlab/config';

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const correlationId = request.headers.get('x-correlation-id') || randomUUID();

  try {
    const responseType = requestUrl.searchParams.get('response_type');
    const clientId = requestUrl.searchParams.get('client_id') || '';
    const redirectUri = requestUrl.searchParams.get('redirect_uri') || '';
    const state = requestUrl.searchParams.get('state') || '';
    const requestedScopes = parseScopeString(requestUrl.searchParams.get('scope'));
    const scopes = requestedScopes.length ? requestedScopes : ['products.write', 'files.write', 'products.read'];

    if (responseType !== 'code') {
      return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 });
    }

    const oauthConfig = getCreatorLabOAuthConfig();
    if (clientId !== oauthConfig.clientId || !isAllowedRedirectUri(redirectUri, oauthConfig)) {
      return NextResponse.json({ error: 'invalid_client_or_redirect_uri' }, { status: 400 });
    }

    if (!validateScopes(scopes)) {
      return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('redirect', requestUrl.pathname + requestUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    const admin = getAdminClient() as any;
    const { data: profile } = await admin
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    const username = profile?.username || user.email?.split('@')[0] || 'creator';
    const code = generateOpaqueToken(24);
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const scopeString = normalizeScopes(scopes);

    await admin.from('creatorlab_oauth_codes').insert({
      code_hash: codeHash,
      client_id: clientId,
      redirect_uri: redirectUri,
      account_id: user.id,
      username,
      scope: scopeString,
      expires_at: expiresAt,
    });

    console.info(
      JSON.stringify({
        event: 'creatorlab.oauth.authorize.issued',
        correlation_id: correlationId,
        account_id: user.id,
      })
    );

    const redirectTarget = new URL(redirectUri);
    redirectTarget.searchParams.set('code', code);
    if (state) {
      redirectTarget.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectTarget);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'creatorlab.oauth.authorize.failed',
        correlation_id: correlationId,
        error: error instanceof Error ? error.message : 'unknown_error',
      })
    );
    return NextResponse.json({ error: 'authorization_failed' }, { status: 500 });
  }
}

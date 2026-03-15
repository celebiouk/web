import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { extractBearerToken, hasRequiredScopes, sha256 } from '@/lib/integrations/creatorlab/auth';
import { creatorLabImportResponseSchema } from '@/lib/integrations/creatorlab/schema';

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function authenticate(request: Request, requiredScopes: string[]) {
  const token = extractBearerToken(request.headers);
  if (!token) {
    return null;
  }

  const admin = getAdminClient() as any;
  const { data: tokenRow } = await admin
    .from('creatorlab_oauth_tokens')
    .select('account_id, scope, expires_at, revoked_at')
    .eq('access_token_hash', sha256(token))
    .is('revoked_at', null)
    .maybeSingle();

  if (!tokenRow || new Date(tokenRow.expires_at).getTime() <= Date.now()) {
    return null;
  }

  if (!hasRequiredScopes(tokenRow.scope, requiredScopes)) {
    return { forbidden: true };
  }

  return { accountId: tokenRow.account_id as string };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const auth = await authenticate(request, ['products.read']);
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if ('forbidden' in auth) {
    return NextResponse.json({ error: 'insufficient_scope' }, { status: 403 });
  }

  const admin = getAdminClient() as any;
  const { data: importRow } = await admin
    .from('creatorlab_imports')
    .select('id, product_id, status')
    .eq('id', id)
    .eq('account_id', auth.accountId)
    .maybeSingle();

  if (!importRow) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!importRow.product_id) {
    return NextResponse.json(
      {
        import_id: importRow.id,
        product_id: '',
        status: importRow.status,
        edit_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio'}/dashboard/products`,
      },
      { status: 200 }
    );
  }

  const productId = importRow.product_id;
  const response = creatorLabImportResponseSchema.parse({
    import_id: importRow.id,
    product_id: productId,
    status: importRow.status,
    edit_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio'}/dashboard/products/${productId}/edit`,
  });

  return NextResponse.json(response);
}

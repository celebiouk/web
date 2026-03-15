import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { extractBearerToken, hasRequiredScopes, sha256 } from '@/lib/integrations/creatorlab/auth';
import {
  creatorLabImportRequestSchema,
  creatorLabImportResponseSchema,
  sanitizeJson,
  sanitizeText,
} from '@/lib/integrations/creatorlab/schema';
import { emitCreatorLabWebhook } from '@/lib/integrations/creatorlab/webhooks';
import { planImportOperation } from '@/lib/integrations/creatorlab/idempotency';

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function authenticateImportRequest(request: Request, requiredScopes: string[]) {
  const token = extractBearerToken(request.headers);
  if (!token) {
    return null;
  }

  const admin = getAdminClient() as any;
  const accessTokenHash = sha256(token);

  const { data: tokenRow } = await admin
    .from('creatorlab_oauth_tokens')
    .select('account_id, username, scope, expires_at, revoked_at')
    .eq('access_token_hash', accessTokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (!tokenRow) {
    return null;
  }

  if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
    return null;
  }

  if (!hasRequiredScopes(tokenRow.scope, requiredScopes)) {
    return { forbidden: true };
  }

  return {
    accountId: tokenRow.account_id as string,
    username: tokenRow.username as string,
    scope: tokenRow.scope as string,
  };
}

export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || randomUUID();
  const admin = getAdminClient() as any;
  let importId: string | null = null;
  let accountId: string | null = null;

  try {
    const auth = await authenticateImportRequest(request, ['products.write', 'files.write']);
    if (!auth) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if ('forbidden' in auth) {
      return NextResponse.json({ error: 'insufficient_scope' }, { status: 403 });
    }

    accountId = auth.accountId;

    const json = await request.json();
    const parsed = creatorLabImportRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    const sanitizedPayload = {
      ...payload,
      metadata: {
        ...payload.metadata,
        title: sanitizeText(payload.metadata.title),
        subtitle: payload.metadata.subtitle ? sanitizeText(payload.metadata.subtitle) : null,
        description: sanitizeText(payload.metadata.description),
        category: sanitizeText(payload.metadata.category),
        tags: payload.metadata.tags.map((tag) => sanitizeText(tag)),
        language: sanitizeText(payload.metadata.language),
        currency: sanitizeText(payload.metadata.currency).toUpperCase(),
      },
      content: {
        raw_text: sanitizeText(payload.content.raw_text),
        formatted_json: sanitizeJson(payload.content.formatted_json) as Record<string, unknown>,
      },
    };

    const { data: existingImport } = await admin
      .from('creatorlab_imports')
      .select('id,product_id,status')
      .eq('account_id', auth.accountId)
      .eq('external_source', sanitizedPayload.external_source)
      .eq('external_id', sanitizedPayload.external_id)
      .maybeSingle();

    const plan = planImportOperation(existingImport || null);

    if (plan.createImportRecord) {
      const insertedImport = await admin
        .from('creatorlab_imports')
        .insert({
          account_id: auth.accountId,
          external_source: sanitizedPayload.external_source,
          external_id: sanitizedPayload.external_id,
          metadata: sanitizedPayload.metadata,
          content: sanitizedPayload.content,
          assets: sanitizedPayload.assets,
          options: sanitizedPayload.options,
          status: 'processing',
          correlation_id: correlationId,
        })
        .select('id')
        .single();

      importId = insertedImport.data?.id || null;
    } else {
      importId = plan.importId || null;
      await admin
        .from('creatorlab_imports')
        .update({
          metadata: sanitizedPayload.metadata,
          content: sanitizedPayload.content,
          assets: sanitizedPayload.assets,
          options: sanitizedPayload.options,
          status: 'processing',
          correlation_id: correlationId,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', importId);
    }

    let productId = plan.productId || null;
    const productData = {
      creator_id: auth.accountId,
      title: sanitizedPayload.metadata.title,
      description: sanitizedPayload.metadata.description,
      price: sanitizedPayload.metadata.price,
      currency: sanitizedPayload.metadata.currency,
      type: 'digital',
      file_url: sanitizedPayload.assets.pdf_url || sanitizedPayload.assets.epub_url,
      is_published: !sanitizedPayload.options.draft,
      metadata: {
        external_source: sanitizedPayload.external_source,
        external_id: sanitizedPayload.external_id,
        subtitle: sanitizedPayload.metadata.subtitle,
        category: sanitizedPayload.metadata.category,
        tags: sanitizedPayload.metadata.tags,
        language: sanitizedPayload.metadata.language,
        import_content_preview: sanitizedPayload.content.raw_text.slice(0, 500),
        formatted_json: sanitizedPayload.content.formatted_json,
        epub_url: sanitizedPayload.assets.epub_url,
        pdf_url: sanitizedPayload.assets.pdf_url,
      },
      updated_at: new Date().toISOString(),
    };

    if (!productId) {
      const insertedProduct = await admin
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      productId = insertedProduct.data?.id || null;
    } else {
      await admin.from('products').update(productData).eq('id', productId).eq('creator_id', auth.accountId);
    }

    await admin
      .from('creatorlab_imports')
      .update({
        product_id: productId,
        status: 'ready',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', importId);

    if (!importId || !productId) {
      throw new Error('import_or_product_missing');
    }

    const responsePayload = creatorLabImportResponseSchema.parse({
      import_id: importId,
      product_id: productId,
      status: 'ready',
      edit_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio'}/dashboard/products/${productId}/edit`,
    });

    console.info(
      JSON.stringify({
        event: 'creatorlab.import.ready',
        correlation_id: correlationId,
        import_id: importId,
        account_id: auth.accountId,
        product_id: productId,
      })
    );

    emitCreatorLabWebhook({
      event: 'import.completed',
      import_id: importId,
      product_id: productId,
      status: 'ready',
      account_id: auth.accountId,
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
    }).catch((error) => {
      console.error(
        JSON.stringify({
          event: 'creatorlab.import.webhook.failed',
          correlation_id: correlationId,
          import_id: importId,
          error: error instanceof Error ? error.message : 'unknown_error',
        })
      );
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    if (importId && accountId) {
      await (admin as any)
        .from('creatorlab_imports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'unknown_error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', importId)
        .eq('account_id', accountId);

      emitCreatorLabWebhook({
        event: 'import.failed',
        import_id: importId,
        product_id: null,
        status: 'failed',
        account_id: accountId,
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'unknown_error',
      }).catch(() => undefined);
    }

    console.error(
      JSON.stringify({
        event: 'creatorlab.import.failed',
        correlation_id: correlationId,
        import_id: importId,
        account_id: accountId,
        error: error instanceof Error ? error.message : 'unknown_error',
      })
    );

    return NextResponse.json({ error: 'import_failed' }, { status: 500 });
  }
}

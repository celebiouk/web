import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Public one-click unsubscribe endpoint.
// The `sub` param is the subscriber's UUID — unguessable (128-bit entropy),
// so no HMAC is needed for this use case.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const sub = searchParams.get('sub') ?? '';

  // Basic UUID shape check before touching the DB
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(sub)) {
    return NextResponse.redirect(`${origin}/unsubscribed?status=invalid`);
  }

  const supabase = await createServiceClient();

  const { error } = await (supabase as any)
    .from('email_subscribers')
    .update({ is_active: false })
    .eq('id', sub);

  if (error) {
    console.error('[unsubscribe] DB error:', error);
    return NextResponse.redirect(`${origin}/unsubscribed?status=error`);
  }

  return NextResponse.redirect(`${origin}/unsubscribed`);
}

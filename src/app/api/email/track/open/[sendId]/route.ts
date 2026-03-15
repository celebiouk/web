import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const PIXEL = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sendId: string }> }
) {
  try {
    const { sendId } = await params;
    const supabase = await createServiceClient();

    await (supabase.from('email_sends') as any)
      .update({ opened_at: new Date().toISOString() })
      .eq('id', sendId)
      .is('opened_at', null);

    return new NextResponse(PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch {
    return new NextResponse(PIXEL, { headers: { 'Content-Type': 'image/gif' } });
  }
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const url = new URL(request.url);
  const destination = url.searchParams.get('url') || '/';

  try {
    const { sendId } = await params;
    const supabase = await createServiceClient();

    await (supabase.from('email_sends') as any)
      .update({ clicked_at: new Date().toISOString() })
      .eq('id', sendId)
      .is('clicked_at', null);
  } catch (error) {
    console.error('Email click tracking error:', error);
  }

  return NextResponse.redirect(destination.startsWith('http') ? destination : '/');
}

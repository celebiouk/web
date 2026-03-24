import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listPaystackBanks } from '@/lib/paystack';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const countryCode = String(url.searchParams.get('countryCode') || '').toUpperCase();
    const banks = await listPaystackBanks(countryCode || null);

    return NextResponse.json({ banks });
  } catch (error) {
    console.error('Paystack banks list error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load banks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

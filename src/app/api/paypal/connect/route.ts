import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPayPalAuthorizeUrl } from '@/lib/paypal';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = Buffer.from(JSON.stringify({ userId: user.id, t: Date.now() })).toString('base64url');
    const url = getPayPalAuthorizeUrl(state);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('PayPal connect init error:', error);
    return NextResponse.json({ error: 'Failed to initiate PayPal connect' }, { status: 500 });
  }
}

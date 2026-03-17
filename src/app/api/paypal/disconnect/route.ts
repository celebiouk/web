import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        paypal_account_id: null,
        paypal_email: null,
        paypal_account_status: 'not_connected',
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect PayPal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect PayPal' }, { status: 500 });
  }
}

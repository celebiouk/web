import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/constants';
import { exchangePayPalCodeForToken, getPayPalUserInfo } from '@/lib/paypal';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(`${APP_URL}/login?error=unauthorized`);
    }

    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.redirect(`${APP_URL}/dashboard/settings/payments?paypal_error=missing_code`);
    }

    const accessToken = await exchangePayPalCodeForToken(code);
    const userInfo = await getPayPalUserInfo(accessToken);

    const paypalAccountId = userInfo.payer_id || userInfo.user_id || null;
    const paypalEmail = userInfo.email || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        paypal_account_id: paypalAccountId,
        paypal_email: paypalEmail,
        paypal_account_status: paypalAccountId ? 'connected' : 'pending',
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('PayPal profile update error:', updateError);
      return NextResponse.redirect(`${APP_URL}/dashboard/settings/payments?paypal_error=update_failed`);
    }

    return NextResponse.redirect(`${APP_URL}/dashboard/settings/payments?paypal=connected`);
  } catch (error) {
    console.error('PayPal connect callback error:', error);
    return NextResponse.redirect(`${APP_URL}/dashboard/settings/payments?paypal_error=callback_failed`);
  }
}

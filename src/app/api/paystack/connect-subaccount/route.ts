import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaystackSubaccount } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const countryCode = String(body.countryCode || '').toUpperCase();
    const accountNumber = String(body.accountNumber || '').trim();
    const bankCode = String(body.bankCode || '').trim();
    const accountName = String(body.accountName || '').trim();

    if (!countryCode || !accountNumber || !bankCode || !accountName) {
      return NextResponse.json({ error: 'countryCode, accountName, accountNumber and bankCode are required' }, { status: 400 });
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('full_name, username')
      .eq('id', user.id)
      .single();

    const businessName = profile?.full_name || profile?.username || accountName;

    const subaccount = await createPaystackSubaccount({
      businessName,
      accountNumber,
      bankCode,
      percentageCharge: 0,
    });

    await (supabase.from('profiles') as any)
      .update({
        payout_country_code: countryCode,
        payout_provider: 'paystack',
        payout_schedule: 'automatic',
        paystack_subaccount_code: subaccount.data.subaccount_code,
        paystack_subaccount_status: 'connected',
        manual_bank_account_name: accountName,
        manual_bank_account_number: accountNumber,
        manual_bank_code: bankCode,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      subaccountCode: subaccount.data.subaccount_code,
    });
  } catch (error) {
    console.error('Paystack connect subaccount error:', error);
    return NextResponse.json({ error: 'Failed to connect Paystack subaccount' }, { status: 500 });
  }
}

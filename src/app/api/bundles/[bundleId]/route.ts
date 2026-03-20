import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isPayoutSetupComplete } from '@/lib/payout-routing';

const updateBundleSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  price_cents: z.number().int().positive().optional(),
  is_published: z.boolean().optional(),
  show_on_storefront: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bundleId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bundleId } = await params;
    const body = updateBundleSchema.parse(await request.json());

    if (body.is_published === true) {
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('payout_country_code,payout_provider,stripe_account_id,stripe_account_status,paystack_subaccount_code,paystack_subaccount_status,manual_bank_account_name,manual_bank_account_number,manual_bank_name,manual_bank_code,manual_bank_iban,manual_bank_swift')
        .eq('id', user.id)
        .single();

      if (!isPayoutSetupComplete(profile)) {
        return NextResponse.json(
          { error: 'Complete payout settings before publishing your bundle.' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await (supabase.from('bundles') as any)
      .update(body)
      .eq('id', bundleId)
      .eq('creator_id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
    }

    return NextResponse.json({ bundle: data });
  } catch (error) {
    console.error('Bundles PATCH error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const schema = z.object({
  username: z.string().min(2),
  affiliate_name: z.string().min(2).max(120),
  affiliate_email: z.string().email(),
  promotion_plan: z.string().max(1200).optional(),
});

function generateCode(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'partner';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}${suffix}`;
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const supabase = await createServiceClient();

    const { data: creator } = await (supabase.from('profiles') as any)
      .select('id,affiliate_enabled,affiliate_default_rate')
      .eq('username', body.username.toLowerCase())
      .maybeSingle();

    if (!creator?.id || !creator.affiliate_enabled) {
      return NextResponse.json({ error: 'Affiliate program unavailable' }, { status: 404 });
    }

    const affiliateCode = generateCode(body.affiliate_name);

    const { data, error } = await (supabase.from('affiliates') as any)
      .insert({
        creator_id: creator.id,
        affiliate_email: body.affiliate_email.toLowerCase(),
        affiliate_name: body.affiliate_name,
        affiliate_code: affiliateCode,
        commission_rate: creator.affiliate_default_rate || 0.2,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    console.error('Affiliate apply error:', error);
    return NextResponse.json({ error: 'Invalid affiliate application' }, { status: 400 });
  }
}

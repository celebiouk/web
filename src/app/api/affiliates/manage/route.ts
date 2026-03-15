import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const actionSchema = z.object({
  type: z.enum(['approve', 'reject', 'mark_paid', 'settings']),
  affiliateId: z.string().uuid().optional(),
  conversionId: z.string().uuid().optional(),
  affiliateEnabled: z.boolean().optional(),
  defaultRate: z.number().min(0.05).max(0.7).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('affiliate_enabled,affiliate_default_rate')
      .eq('id', user.id)
      .single();

    const { data: affiliates } = await (supabase.from('affiliates') as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    const affiliateIds = (affiliates || []).map((row: { id: string }) => row.id);
    const { data: conversions } = affiliateIds.length
      ? await (supabase.from('affiliate_conversions') as any)
        .select('*')
        .in('affiliate_id', affiliateIds)
        .order('created_at', { ascending: false })
      : { data: [] as any[] };

    return NextResponse.json({
      settings: profile || { affiliate_enabled: false, affiliate_default_rate: 0.2 },
      affiliates: affiliates || [],
      conversions: conversions || [],
    });
  } catch (error) {
    console.error('Affiliate manage GET error:', error);
    return NextResponse.json({ error: 'Failed to load affiliates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = actionSchema.parse(await request.json());

    if (body.type === 'settings') {
      await (supabase.from('profiles') as any)
        .update({
          affiliate_enabled: body.affiliateEnabled ?? false,
          affiliate_default_rate: body.defaultRate ?? 0.2,
        })
        .eq('id', user.id);

      return NextResponse.json({ success: true });
    }

    if ((body.type === 'approve' || body.type === 'reject') && body.affiliateId) {
      await (supabase.from('affiliates') as any)
        .update({ status: body.type === 'approve' ? 'approved' : 'rejected' })
        .eq('id', body.affiliateId)
        .eq('creator_id', user.id);

      return NextResponse.json({ success: true });
    }

    if (body.type === 'mark_paid' && body.conversionId) {
      await (supabase.from('affiliate_conversions') as any)
        .update({ status: 'paid' })
        .eq('id', body.conversionId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Affiliate manage POST error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 400 });
  }
}

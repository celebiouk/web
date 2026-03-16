import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hashTestimonialToken } from '@/lib/testimonials';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const tokenHash = hashTestimonialToken(token);

    const supabase = await createServiceClient();

    const { data: reqRow, error } = await (supabase as any)
      .from('testimonial_requests')
      .select('id,status,expires_at,buyer_email,products(title),orders(id,status)')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error || !reqRow) {
      return NextResponse.json({ valid: false, error: 'Invalid link' }, { status: 404 });
    }

    if (reqRow.status !== 'pending') {
      return NextResponse.json({ valid: false, error: 'This testimonial request is no longer active' }, { status: 400 });
    }

    if (new Date(reqRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ valid: false, error: 'This testimonial request has expired' }, { status: 400 });
    }

    if (reqRow.orders?.status !== 'completed') {
      return NextResponse.json({ valid: false, error: 'Order is not eligible for testimonials' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      buyerEmail: reqRow.buyer_email,
      productTitle: reqRow.products?.title || 'your purchase',
    });
  } catch (error) {
    console.error('Testimonial request token GET error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}

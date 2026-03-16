import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { hashTestimonialToken } from '@/lib/testimonials';

const submitSchema = z.object({
  token: z.string().min(10),
  buyerName: z.string().min(2).max(120),
  buyerEmail: z.string().email(),
  buyerAvatarUrl: z.string().url().optional().or(z.literal('')),
  content: z.string().min(20).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function POST(request: Request) {
  try {
    const body = submitSchema.parse(await request.json());
    const tokenHash = hashTestimonialToken(body.token);

    const supabase = await createServiceClient();

    const { data: reqRow, error: reqError } = await (supabase as any)
      .from('testimonial_requests')
      .select('id,creator_id,product_id,order_id,buyer_email,status,expires_at,orders(status,buyer_email),products(title)')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (reqError || !reqRow) {
      return NextResponse.json({ error: 'Invalid testimonial link' }, { status: 404 });
    }

    if (reqRow.status !== 'pending') {
      return NextResponse.json({ error: 'This testimonial request is no longer active' }, { status: 400 });
    }

    if (new Date(reqRow.expires_at).getTime() < Date.now()) {
      await (supabase as any)
        .from('testimonial_requests')
        .update({ status: 'expired' })
        .eq('id', reqRow.id);
      return NextResponse.json({ error: 'This testimonial request has expired' }, { status: 400 });
    }

    const normalizedBuyerEmail = body.buyerEmail.trim().toLowerCase();
    const expectedEmail = (reqRow.buyer_email || '').trim().toLowerCase();

    if (normalizedBuyerEmail !== expectedEmail) {
      return NextResponse.json({ error: 'Email does not match the purchase record' }, { status: 400 });
    }

    if (reqRow.orders?.status !== 'completed') {
      return NextResponse.json({ error: 'Only completed purchases can submit testimonials' }, { status: 400 });
    }

    const { data: existingTestimonial } = await (supabase as any)
      .from('testimonials')
      .select('id')
      .eq('order_id', reqRow.order_id)
      .maybeSingle();

    if (existingTestimonial) {
      return NextResponse.json({ error: 'A testimonial for this purchase already exists' }, { status: 400 });
    }

    const { error: insertError } = await (supabase as any)
      .from('testimonials')
      .insert({
        creator_id: reqRow.creator_id,
        product_id: reqRow.product_id,
        order_id: reqRow.order_id,
        testimonial_request_id: reqRow.id,
        buyer_email: normalizedBuyerEmail,
        buyer_name: body.buyerName.trim(),
        buyer_avatar_url: body.buyerAvatarUrl?.trim() || null,
        rating: body.rating || null,
        content: body.content.trim(),
        content_html: `<p>${body.content.trim().replace(/\n/g, '</p><p>')}</p>`,
        is_verified: true,
        is_published: false,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: updateRequestError } = await (supabase as any)
      .from('testimonial_requests')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', reqRow.id);

    if (updateRequestError) {
      console.error('Failed to mark testimonial request submitted:', updateRequestError);
    }

    return NextResponse.json({ ok: true, productTitle: reqRow.products?.title || 'product' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('Testimonial submit POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

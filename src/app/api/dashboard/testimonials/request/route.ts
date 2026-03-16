import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildTestimonialSubmitUrl, generateTestimonialToken, sendTestimonialRequestEmail } from '@/lib/testimonials';

const requestSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = requestSchema.parse(await request.json());

    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .select('id,creator_id,product_id,buyer_email,status,products(title),profiles!orders_creator_id_fkey(full_name)')
      .eq('id', body.orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Only completed orders can request testimonials' }, { status: 400 });
    }

    const { data: existingTestimonial } = await (supabase as any)
      .from('testimonials')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingTestimonial) {
      return NextResponse.json({ error: 'A testimonial for this order already exists' }, { status: 400 });
    }

    const { data: existingRequest } = await (supabase as any)
      .from('testimonial_requests')
      .select('id,status')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingRequest && existingRequest.status === 'pending') {
      return NextResponse.json({ error: 'A testimonial request is already pending for this order' }, { status: 400 });
    }

    const { token, tokenHash } = generateTestimonialToken();
    const submitUrl = buildTestimonialSubmitUrl(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

    const { error: insertError } = await (supabase as any)
      .from('testimonial_requests')
      .insert({
        creator_id: user.id,
        product_id: order.product_id,
        order_id: order.id,
        buyer_email: order.buyer_email,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: expiresAt,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const creatorName = order.profiles?.full_name || 'the creator';
    const productTitle = order.products?.title || 'your purchase';

    const emailResult = await sendTestimonialRequestEmail({
      to: order.buyer_email,
      creatorName,
      productTitle,
      submitUrl,
    });

    return NextResponse.json({
      ok: true,
      submitUrl,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('Dashboard testimonial request POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

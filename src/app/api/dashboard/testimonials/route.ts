import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [ordersRes, requestsRes, testimonialsRes] = await Promise.all([
      (supabase as any)
        .from('orders')
        .select('id,product_id,buyer_email,status,created_at,products(title)')
        .eq('creator_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100),
      (supabase as any)
        .from('testimonial_requests')
        .select('id,order_id,status,expires_at,submitted_at,created_at')
        .eq('creator_id', user.id),
      (supabase as any)
        .from('testimonials')
        .select('id,product_id,order_id,buyer_name,buyer_email,buyer_avatar_url,content,rating,is_published,created_at,products(title)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (ordersRes.error || requestsRes.error || testimonialsRes.error) {
      return NextResponse.json({
        error: ordersRes.error?.message || requestsRes.error?.message || testimonialsRes.error?.message || 'Failed to load testimonials',
      }, { status: 500 });
    }

    return NextResponse.json({
      completedOrders: ordersRes.data || [],
      requests: requestsRes.data || [],
      testimonials: testimonialsRes.data || [],
    });
  } catch (error) {
    console.error('Dashboard testimonials GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const [productsRes, ordersRes, bookingsRes, subscribersRes, coursesRes] = await Promise.all([
      (supabase.from('products') as any)
        .select('id,title')
        .eq('creator_id', user.id)
        .ilike('title', `%${q}%`)
        .limit(6),
      (supabase.from('orders') as any)
        .select('id,buyer_email')
        .eq('creator_id', user.id)
        .ilike('buyer_email', `%${q}%`)
        .limit(6),
      (supabase.from('bookings') as any)
        .select('id,buyer_name,buyer_email')
        .eq('creator_id', user.id)
        .or(`buyer_name.ilike.%${q}%,buyer_email.ilike.%${q}%`)
        .limit(6),
      (supabase.from('email_subscribers') as any)
        .select('id,email,first_name')
        .eq('creator_id', user.id)
        .or(`email.ilike.%${q}%,first_name.ilike.%${q}%`)
        .limit(6),
      (supabase.from('courses') as any)
        .select('id,title')
        .eq('creator_id', user.id)
        .ilike('title', `%${q}%`)
        .limit(6),
    ]);

    const results = [
      ...(productsRes.data || []).map((row: { id: string; title: string }) => ({
        id: `product-${row.id}`,
        label: row.title,
        type: 'product',
        href: `/dashboard/products/${row.id}/edit`,
      })),
      ...(ordersRes.data || []).map((row: { id: string; buyer_email: string }) => ({
        id: `order-${row.id}`,
        label: row.buyer_email,
        type: 'order',
        href: '/dashboard/orders',
      })),
      ...(bookingsRes.data || []).map((row: { id: string; buyer_name: string; buyer_email: string }) => ({
        id: `booking-${row.id}`,
        label: row.buyer_name || row.buyer_email,
        type: 'booking',
        href: '/dashboard/bookings',
      })),
      ...(subscribersRes.data || []).map((row: { id: string; email: string; first_name?: string | null }) => ({
        id: `subscriber-${row.id}`,
        label: row.first_name ? `${row.first_name} (${row.email})` : row.email,
        type: 'subscriber',
        href: '/dashboard/email/subscribers',
      })),
      ...(coursesRes.data || []).map((row: { id: string; title: string }) => ({
        id: `course-${row.id}`,
        label: row.title,
        type: 'course',
        href: `/dashboard/courses/${row.id}/edit`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

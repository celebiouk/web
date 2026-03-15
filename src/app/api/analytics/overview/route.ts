import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PresetRange = '7d' | '30d' | '90d' | 'year' | 'all';

function getDateRange(range: PresetRange, customFrom?: string | null, customTo?: string | null) {
  const now = new Date();
  const end = customTo ? new Date(customTo) : now;
  const start = customFrom ? new Date(customFrom) : new Date(now);

  if (!customFrom) {
    if (range === '7d') start.setDate(now.getDate() - 6);
    if (range === '30d') start.setDate(now.getDate() - 29);
    if (range === '90d') start.setDate(now.getDate() - 89);
    if (range === 'year') start.setMonth(0, 1);
    if (range === 'all') start.setFullYear(2000, 0, 1);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const range = (url.searchParams.get('range') || '30d') as PresetRange;
    const customFrom = url.searchParams.get('from');
    const customTo = url.searchParams.get('to');
    const format = url.searchParams.get('format');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, full_name')
      .eq('id', user.id)
      .single();

    const tier = (profile as { subscription_tier?: 'free' | 'pro' } | null)?.subscription_tier || 'free';
    const isPro = tier === 'pro';

    const { start, end } = getDateRange(range, customFrom, customTo);
    const spanMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - spanMs - 1);
    const prevEnd = new Date(start.getTime() - 1);

    const [{ data: orders }, { data: prevOrders }, { data: events }, { data: prevEvents }, { count: subscribersTotal }, { count: newSubscribers }] = await Promise.all([
      (supabase.from('orders') as any)
        .select('id,product_id,amount_cents,created_at,status')
        .eq('creator_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      (supabase.from('orders') as any)
        .select('id,product_id,amount_cents,created_at,status')
        .eq('creator_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString()),
      (supabase.from('analytics_events') as any)
        .select('event_type,product_id,utm_source,country,device,created_at')
        .eq('creator_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      (supabase.from('analytics_events') as any)
        .select('event_type,created_at')
        .eq('creator_id', user.id)
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString()),
      (supabase.from('email_subscribers') as any)
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('is_active', true),
      (supabase.from('email_subscribers') as any)
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .gte('subscribed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const currentOrders = orders || [];
    const previousOrders = prevOrders || [];
    const currentEvents = events || [];
    const previousEvents = prevEvents || [];

    const revenue = currentOrders.reduce((sum: number, row: { amount_cents: number }) => sum + row.amount_cents, 0);
    const prevRevenue = previousOrders.reduce((sum: number, row: { amount_cents: number }) => sum + row.amount_cents, 0);
    const orderCount = currentOrders.length;
    const prevOrderCount = previousOrders.length;

    const pageViews = currentEvents.filter((e: { event_type: string }) => e.event_type === 'page_view').length;
    const prevPageViews = previousEvents.filter((e: { event_type: string }) => e.event_type === 'page_view').length;
    const conversionRate = pageViews > 0 ? Number(((orderCount / pageViews) * 100).toFixed(2)) : 0;
    const prevConversionRate = prevPageViews > 0 ? Number(((prevOrderCount / prevPageViews) * 100).toFixed(2)) : 0;
    const aov = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
    const prevAov = prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

    const revenueByDay = new Map<string, { revenue: number; orders: number }>();
    for (const order of currentOrders as Array<{ created_at: string; amount_cents: number }>) {
      const day = order.created_at.slice(0, 10);
      const existing = revenueByDay.get(day) || { revenue: 0, orders: 0 };
      existing.revenue += order.amount_cents;
      existing.orders += 1;
      revenueByDay.set(day, existing);
    }
    const revenueSeries = Array.from(revenueByDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, revenue: value.revenue, orders: value.orders }));

    const sourceBuckets = new Map<string, number>();
    const countryBuckets = new Map<string, number>();
    const deviceBuckets = new Map<string, number>();
    const heatmapBuckets = new Map<string, number>();
    const productViews = new Map<string, number>();
    const productOrders = new Map<string, { orders: number; revenue: number }>();

    for (const ev of currentEvents as Array<{ event_type: string; utm_source?: string | null; country?: string | null; device?: string | null; created_at: string; product_id?: string | null }>) {
      if (ev.event_type === 'page_view') {
        const sourceRaw = (ev.utm_source || '').toLowerCase();
        const source = sourceRaw.includes('instagram')
          ? 'Instagram'
          : sourceRaw.includes('tiktok')
            ? 'TikTok'
            : sourceRaw.includes('twitter') || sourceRaw.includes('x')
              ? 'Twitter/X'
              : sourceRaw.includes('youtube')
                ? 'YouTube'
                : sourceRaw
                  ? 'Other'
                  : 'Direct';
        sourceBuckets.set(source, (sourceBuckets.get(source) || 0) + 1);

        const country = (ev.country || 'Unknown').toUpperCase();
        countryBuckets.set(country, (countryBuckets.get(country) || 0) + 1);

        const device = ev.device || 'desktop';
        deviceBuckets.set(device, (deviceBuckets.get(device) || 0) + 1);

        const date = new Date(ev.created_at);
        const key = `${date.getDay()}-${date.getHours()}`;
        heatmapBuckets.set(key, (heatmapBuckets.get(key) || 0) + 1);
      }

      if (ev.event_type === 'product_view' && ev.product_id) {
        productViews.set(ev.product_id, (productViews.get(ev.product_id) || 0) + 1);
      }
    }

    for (const order of currentOrders as Array<{ product_id: string; amount_cents: number }>) {
      const existing = productOrders.get(order.product_id) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.amount_cents;
      productOrders.set(order.product_id, existing);
    }

    const productIds = Array.from(new Set([...productViews.keys(), ...productOrders.keys()]));
    const { data: products } = productIds.length
      ? await (supabase.from('products') as any).select('id,title,type').in('id', productIds)
      : { data: [] as Array<{ id: string; title: string; type: string }> };

    const topProducts = (products || []).map((product: { id: string; title: string; type: string }) => {
      const views = productViews.get(product.id) || 0;
      const orderStats = productOrders.get(product.id) || { orders: 0, revenue: 0 };
      return {
        id: product.id,
        name: product.title,
        type: product.type,
        views,
        orders: orderStats.orders,
        revenue: orderStats.revenue,
        conversionRate: views > 0 ? Number(((orderStats.orders / views) * 100).toFixed(2)) : 0,
      };
    }).sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue);

    const { data: bookings } = await (supabase.from('bookings') as any)
      .select('id,amount_cents,scheduled_at,buyer_email,status')
      .eq('creator_id', user.id)
      .eq('status', 'confirmed')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const bookingRows = bookings || [];
    const bookingRevenue = bookingRows.reduce((sum: number, row: { amount_cents: number }) => sum + row.amount_cents, 0);
    const repeatBookingRate = bookingRows.length
      ? Number((1 - (new Set(bookingRows.map((b: { buyer_email: string }) => b.buyer_email)).size / bookingRows.length)) * 100)
      : 0;

    const { data: courseRows } = await (supabase.from('courses') as any)
      .select('id,title')
      .eq('creator_id', user.id);

    const courseAnalytics: Array<{ id: string; title: string; enrolled: number; completionRate: number; avgProgress: number; revenue: number }> = [];
    if (courseRows?.length) {
      for (const course of courseRows as Array<{ id: string; title: string }>) {
        const { data: enrollments } = await (supabase.from('enrollments') as any)
          .select('id,amount_cents')
          .eq('course_id', course.id);

        const enrolled = enrollments?.length || 0;
        const revenueSum = (enrollments || []).reduce((sum: number, row: { amount_cents: number }) => sum + row.amount_cents, 0);
        courseAnalytics.push({
          id: course.id,
          title: course.title,
          enrolled,
          completionRate: 0,
          avgProgress: 0,
          revenue: revenueSum,
        });
      }
    }

    const heatmap = Array.from(heatmapBuckets.entries()).map(([key, views]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, views };
    });

    const responsePayload = {
      isPro,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      overview: {
        totalRevenue: revenue,
        revenueChange: percentChange(revenue, prevRevenue),
        totalOrders: orderCount,
        ordersChange: percentChange(orderCount, prevOrderCount),
        pageViews,
        pageViewsChange: percentChange(pageViews, prevPageViews),
        conversionRate,
        conversionRateChange: percentChange(conversionRate, prevConversionRate),
        emailSubscribers: subscribersTotal || 0,
        newSubscribersThisMonth: newSubscribers || 0,
        averageOrderValue: aov,
        averageOrderValueChange: percentChange(aov, prevAov),
      },
      revenueSeries,
      trafficSources: Array.from(sourceBuckets.entries()).map(([source, views]) => ({ source, views })),
      topCountries: Array.from(countryBuckets.entries()).map(([country, views]) => ({ country, views })).sort((a, b) => b.views - a.views).slice(0, 10),
      deviceBreakdown: Array.from(deviceBuckets.entries()).map(([device, value]) => ({ device, value })),
      peakTrafficHeatmap: heatmap,
      topProducts,
      bookingsAnalytics: {
        totalCalls: bookingRows.length,
        revenue: bookingRevenue,
        avgSessionValue: bookingRows.length ? Math.round(bookingRevenue / bookingRows.length) : 0,
        repeatBookingRate: Number(repeatBookingRate.toFixed(2)),
      },
      courseAnalytics,
    };

    if (format === 'csv') {
      const lines: string[] = [];
      lines.push('section,metric,value');
      lines.push(`overview,total_revenue_cents,${csvEscape(responsePayload.overview.totalRevenue)}`);
      lines.push(`overview,total_orders,${csvEscape(responsePayload.overview.totalOrders)}`);
      lines.push(`overview,page_views,${csvEscape(responsePayload.overview.pageViews)}`);
      lines.push(`overview,conversion_rate,${csvEscape(responsePayload.overview.conversionRate)}`);
      lines.push(`overview,email_subscribers,${csvEscape(responsePayload.overview.emailSubscribers)}`);
      lines.push(`overview,average_order_value_cents,${csvEscape(responsePayload.overview.averageOrderValue)}`);
      lines.push('');
      lines.push('date,revenue_cents,orders');
      for (const row of revenueSeries) {
        lines.push(`${csvEscape(row.date)},${csvEscape(row.revenue)},${csvEscape(row.orders)}`);
      }

      return new NextResponse(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="analytics-${range}.csv"`,
        },
      });
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}

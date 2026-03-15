import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const eventSchema = z.object({
  type: z.enum(['page_view', 'product_view', 'checkout_started', 'purchase', 'email_signup']),
  creator_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  country: z.string().optional(),
  device: z.enum(['mobile', 'desktop', 'tablet']).optional(),
});

function detectDevice(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase();
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'tablet';
  }
  if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) {
    return 'mobile';
  }
  return 'desktop';
}

export async function POST(request: Request) {
  try {
    const parsed = eventSchema.parse(await request.json());
    const supabase = await createServiceClient();

    const headerCountry = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || undefined;
    const userAgent = request.headers.get('user-agent') || '';

    await (supabase.from('analytics_events') as any).insert({
      creator_id: parsed.creator_id,
      event_type: parsed.type,
      product_id: parsed.product_id || null,
      utm_source: parsed.utm_source || null,
      utm_medium: parsed.utm_medium || null,
      utm_campaign: parsed.utm_campaign || null,
      country: parsed.country || headerCountry || null,
      device: parsed.device || detectDevice(userAgent),
      metadata: parsed.metadata || {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ error: 'Invalid analytics event' }, { status: 400 });
  }
}

export type AnalyticsEventType = 'page_view' | 'product_view' | 'checkout_started' | 'purchase' | 'email_signup';

export type AnalyticsDevice = 'mobile' | 'desktop' | 'tablet';

export interface TrackEventInput {
  type: AnalyticsEventType;
  creator_id: string;
  product_id?: string;
  metadata?: Record<string, string>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  country?: string;
  device?: AnalyticsDevice;
}

export async function trackEvent(event: TrackEventInput): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // Fire-and-forget analytics should never block UX
  }
}

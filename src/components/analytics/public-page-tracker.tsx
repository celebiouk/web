'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/track';

interface PublicPageTrackerProps {
  creatorId: string;
}

export function PublicPageTracker({ creatorId }: PublicPageTrackerProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get('utm_source') || undefined;
    const utm_medium = params.get('utm_medium') || undefined;
    const utm_campaign = params.get('utm_campaign') || undefined;

    void trackEvent({
      type: 'page_view',
      creator_id: creatorId,
      utm_source,
      utm_medium,
      utm_campaign,
    });

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a');
      if (!link) {
        return;
      }

      const href = link.getAttribute('href') || '';
      const isProductIntent = href.includes('/checkout/') || href.includes('/book/');
      if (!isProductIntent) {
        return;
      }

      const productIdMatch = href.match(/\/(checkout|book)\/([^/?#]+)/);
      const productId = productIdMatch?.[2];

      void trackEvent({
        type: 'product_view',
        creator_id: creatorId,
        product_id: productId,
        utm_source,
        utm_medium,
        utm_campaign,
        metadata: {
          href,
        },
      });
    };

    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [creatorId]);

  return null;
}

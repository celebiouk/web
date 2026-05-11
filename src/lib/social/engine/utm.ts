// Auto-injects UTM params into any cele.bio link found in a caption so we can
// attribute storefront traffic back to the scheduled post that drove it.

const CELE_HOSTS = new Set(['cele.bio', 'www.cele.bio']);

export interface UtmTags {
  source: string;       // The platform — e.g. "instagram"
  campaign?: string;    // The scheduled_posts.utm_campaign field
  medium?: string;      // Defaults to "social"
}

const URL_RE = /\bhttps?:\/\/[^\s)]+/g;

export function injectUtm(caption: string, tags: UtmTags): string {
  if (!caption) return caption;

  return caption.replace(URL_RE, (raw) => {
    try {
      const u = new URL(raw);
      if (!CELE_HOSTS.has(u.hostname)) return raw;

      if (!u.searchParams.has('utm_source'))   u.searchParams.set('utm_source', tags.source);
      if (!u.searchParams.has('utm_medium'))   u.searchParams.set('utm_medium', tags.medium ?? 'social');
      if (tags.campaign && !u.searchParams.has('utm_campaign')) {
        u.searchParams.set('utm_campaign', tags.campaign);
      }
      return u.toString();
    } catch {
      return raw;
    }
  });
}

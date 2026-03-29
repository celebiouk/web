const DEFAULT_TIKTOK_SCOPE = 'user.info.basic';

function sanitizeScope(rawScope: string | undefined): string {
  if (!rawScope) {
    return DEFAULT_TIKTOK_SCOPE;
  }

  const normalized = rawScope
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(',');

  return normalized || DEFAULT_TIKTOK_SCOPE;
}

export function getTikTokOAuthScope(): string {
  return sanitizeScope(process.env.TIKTOK_OAUTH_SCOPE);
}

export function getTikTokRedirectUri(requestUrl: string): string {
  const { origin } = new URL(requestUrl);
  const explicitRedirect = process.env.TIKTOK_REDIRECT_URI?.trim();

  if (explicitRedirect) {
    return explicitRedirect;
  }

  return `${origin}/api/auth/callback/tiktok`;
}

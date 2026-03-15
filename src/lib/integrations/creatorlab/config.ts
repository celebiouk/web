export const CREATORLAB_SUPPORTED_SCOPES = ['products.write', 'files.write', 'products.read'] as const;

export interface CreatorLabOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
}

export function getCreatorLabOAuthConfig(): CreatorLabOAuthConfig {
  const clientId = process.env.CREATORLAB_CLIENT_ID ?? process.env.CLIENT_ID ?? '';
  const clientSecret = process.env.CREATORLAB_CLIENT_SECRET ?? process.env.CLIENT_SECRET ?? '';
  const singleRedirectUri = process.env.CREATORLAB_REDIRECT_URI ?? process.env.REDIRECT_URI ?? '';
  const multipleRedirectUris = process.env.CREATORLAB_REDIRECT_URIS ?? '';
  const redirectUris = [
    ...multipleRedirectUris
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    ...(singleRedirectUri ? [singleRedirectUri.trim()] : []),
  ];

  if (!clientId || !clientSecret || redirectUris.length === 0) {
    throw new Error('CreatorLab OAuth is not configured');
  }

  return {
    clientId,
    clientSecret,
    redirectUris: [...new Set(redirectUris)],
  };
}

export function isAllowedRedirectUri(redirectUri: string, config: CreatorLabOAuthConfig): boolean {
  return config.redirectUris.includes(redirectUri);
}

export function parseScopeString(input: string | null | undefined): string[] {
  if (!input) {
    return [];
  }

  return input
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function validateScopes(scopes: string[]): boolean {
  if (scopes.length === 0) {
    return false;
  }

  return scopes.every((scope) => CREATORLAB_SUPPORTED_SCOPES.includes(scope as (typeof CREATORLAB_SUPPORTED_SCOPES)[number]));
}

export function normalizeScopes(scopes: string[]): string {
  return [...new Set(scopes)].join(' ');
}

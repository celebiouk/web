import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const creatorLabTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().min(1),
  token_type: z.literal('Bearer'),
  account: z.object({
    id: z.string().uuid(),
    username: z.string().min(1),
  }),
});

export type CreatorLabTokenResponse = z.infer<typeof creatorLabTokenResponseSchema>;

export interface CreatorLabAccountContext {
  id: string;
  username: string;
  scope: string;
}

export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function extractBearerToken(headers: Headers): string | null {
  const authorization = headers.get('authorization') || headers.get('Authorization');
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function hasRequiredScopes(grantedScope: string, requiredScopes: string[]): boolean {
  if (requiredScopes.length === 0) {
    return true;
  }

  const granted = new Set(
    grantedScope
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter(Boolean)
  );

  return requiredScopes.every((scope) => granted.has(scope));
}

export function buildCreatorLabTokenResponse(params: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  account: { id: string; username: string };
}): CreatorLabTokenResponse {
  return creatorLabTokenResponseSchema.parse({
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
    expires_in: params.expiresIn,
    scope: params.scope,
    token_type: 'Bearer',
    account: {
      id: params.account.id,
      username: params.account.username,
    },
  });
}

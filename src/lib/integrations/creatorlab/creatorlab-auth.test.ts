import { describe, expect, it } from 'vitest';
import {
  buildCreatorLabTokenResponse,
  extractBearerToken,
  hasRequiredScopes,
} from '@/lib/integrations/creatorlab/auth';

describe('CreatorLab auth helpers', () => {
  it('builds token response contract', () => {
    const response = buildCreatorLabTokenResponse({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: 3600,
      scope: 'products.write files.write products.read',
      account: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'alice',
      },
    });

    expect(response.token_type).toBe('Bearer');
    expect(response.expires_in).toBe(3600);
    expect(response.account.username).toBe('alice');
  });

  it('extracts bearer token from authorization header', () => {
    const headers = new Headers({ Authorization: 'Bearer abc123' });
    expect(extractBearerToken(headers)).toBe('abc123');
  });

  it('checks required scopes correctly', () => {
    expect(hasRequiredScopes('products.write files.write products.read', ['products.write'])).toBe(true);
    expect(hasRequiredScopes('products.read', ['products.write'])).toBe(false);
  });
});

// Shared types for every platform adapter.
// Each adapter implements `SocialAdapter` and stays dormant until its env vars are set.

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'threads'
  | 'facebook';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
}

export interface AdapterAccount {
  id: string;
  platform: SocialPlatform;
  platform_user_id: string;
  platform_username: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  meta: Record<string, unknown>;
}

export interface AdapterContent {
  caption: string;
  media: MediaItem[];
  // Per-platform tweaks like first_comment, link, etc.
  overrides?: Record<string, unknown>;
}

export type AdapterErrorCode =
  | 'NOT_IMPLEMENTED'   // Adapter not wired up yet (env vars missing / API approval pending)
  | 'TOKEN_EXPIRED'     // Access token rejected — needs reconnect
  | 'RATE_LIMITED'      // Hit platform rate limit
  | 'INVALID_MEDIA'     // Media format/size not accepted
  | 'PERMISSION_DENIED' // Scope or account-type problem
  | 'PLATFORM_ERROR'    // Generic platform 4xx/5xx
  | 'NETWORK_ERROR';    // Couldn't even reach the API

export type AdapterResult =
  | {
      ok: true;
      platform_post_id: string;
      platform_post_url?: string;
    }
  | {
      ok: false;
      code: AdapterErrorCode;
      message: string;
      retryable: boolean;
    };

export interface SocialAdapter {
  platform: SocialPlatform;
  /**
   * True only when the required env vars are present and the platform is ready
   * to receive posts. Adapters return a NOT_IMPLEMENTED result when called
   * while unconfigured, so the engine can degrade gracefully.
   */
  isConfigured: () => boolean;
  post: (account: AdapterAccount, content: AdapterContent) => Promise<AdapterResult>;
}

import type { SocialAdapter, SocialPlatform } from './types';
import { instagramAdapter } from './instagram';
import { tiktokAdapter } from './tiktok';
import { twitterAdapter } from './twitter';
import { youtubeAdapter } from './youtube';
import { linkedinAdapter } from './linkedin';
import { threadsAdapter } from './threads';
import { facebookAdapter } from './facebook';

const REGISTRY: Record<SocialPlatform, SocialAdapter> = {
  instagram: instagramAdapter,
  tiktok:    tiktokAdapter,
  twitter:   twitterAdapter,
  youtube:   youtubeAdapter,
  linkedin:  linkedinAdapter,
  threads:   threadsAdapter,
  facebook:  facebookAdapter,
};

export function getAdapter(platform: SocialPlatform): SocialAdapter {
  return REGISTRY[platform];
}

export function listAdapters(): SocialAdapter[] {
  return Object.values(REGISTRY);
}

export type { SocialAdapter, SocialPlatform } from './types';

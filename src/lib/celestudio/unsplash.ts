// Unsplash search — fetches topical photos based on AI-generated keywords.
// Free tier: 50 req/hour (demo) or 5000/hour (production after Unsplash review).
// Falls back gracefully (returns null) when the access key is missing or the
// API fails, so generation never blocks on image lookup.

import type { Block, CoverBlock, ChapterIntroBlock } from './blocks';

interface UnsplashSearchResponse {
  results?: Array<{
    urls?: { regular?: string; full?: string };
  }>;
}

/**
 * Search Unsplash for a single landscape photo matching the query.
 * Returns null if the access key is missing, the request fails, or no
 * results are returned. Times out after 3 seconds to keep us under the
 * Vercel function ceiling.
 */
export async function searchUnsplashImage(query: string, orientation: 'landscape' | 'portrait' = 'landscape'): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !query) return null;

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '1');
    url.searchParams.set('orientation', orientation);
    url.searchParams.set('content_filter', 'high'); // Family-safe content

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as UnsplashSearchResponse;
    return data.results?.[0]?.urls?.regular ?? data.results?.[0]?.urls?.full ?? null;
  } catch {
    return null;
  }
}

/**
 * Take an array of blocks, find the cover and chapter_intro entries,
 * fetch a topical photo for each in parallel, and return the blocks
 * with `imageUrl` populated. Total wall-clock time ≈ slowest single
 * fetch (parallel), capped at 3s per fetch.
 *
 * Blocks that already have an imageUrl (e.g. user-uploaded) are skipped.
 * Blocks without an imageQuery are also skipped (renderer falls back to Picsum).
 */
export async function enrichBlocksWithImages(blocks: Block[]): Promise<Block[]> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return blocks;

  const enriched = await Promise.all(blocks.map(async (block) => {
    const isImageable = block.type === 'cover' || block.type === 'chapter_intro';
    if (!isImageable) return block;

    const typed = block as CoverBlock | ChapterIntroBlock;
    if (typed.imageUrl || !typed.imageQuery) return block;

    const orientation = block.type === 'cover' ? 'portrait' : 'landscape';
    const url = await searchUnsplashImage(typed.imageQuery, orientation);
    if (!url) return block;

    return { ...block, imageUrl: url };
  }));

  return enriched;
}

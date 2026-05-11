import type { AdapterResult } from './types';

// Returned by every adapter that hasn't been wired up yet. Lets the engine treat
// "API approval not landed" identically to a soft, non-retryable failure — the
// post is marked skipped instead of crash-looping the cron.
export function unimplementedResult(platform: string): AdapterResult {
  return {
    ok: false,
    code: 'NOT_IMPLEMENTED',
    message: `${platform} adapter is not yet configured (missing env vars or pending API approval).`,
    retryable: false,
  };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { PostComposer } from './PostComposer';
import { Loader2, Trash2, Plug, Plus, ExternalLink } from 'lucide-react';

type PlatformId =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'threads'
  | 'facebook';

const PLATFORMS: Array<{ id: PlatformId; label: string }> = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'twitter',   label: 'X' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'threads',   label: 'Threads' },
  { id: 'facebook',  label: 'Facebook' },
];

interface ScheduledPost {
  id: string;
  caption: string;
  media: Array<{ url: string; type: 'image' | 'video' }>;
  platforms: PlatformId[];
  scheduled_for: string;
  status: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';
  utm_campaign: string | null;
  posted_at: string | null;
}

interface PostResult {
  scheduled_post_id: string;
  platform: string;
  status: string;
  platform_post_url: string | null;
  error_message: string | null;
}

interface PromotableProduct {
  id: string;
  title: string;
}

interface ScheduleClientProps {
  connectedPlatforms: PlatformId[];
  products: PromotableProduct[];
}

export function ScheduleClient({ connectedPlatforms, products }: ScheduleClientProps) {
  const connectedSet = new Set<PlatformId>(connectedPlatforms);

  const [composerOpen, setComposerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [resultsByPost, setResultsByPost] = useState<Record<string, PostResult[]>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scheduled-posts');
      const data = await res.json();
      const postList: ScheduledPost[] = data.posts ?? [];
      const results: PostResult[] = data.results ?? [];

      const grouped: Record<string, PostResult[]> = {};
      for (const r of results) {
        if (!grouped[r.scheduled_post_id]) grouped[r.scheduled_post_id] = [];
        grouped[r.scheduled_post_id].push(r);
      }
      setPosts(postList);
      setResultsByPost(grouped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function cancelPost(id: string) {
    if (!confirm('Cancel this scheduled post? It will not be published.')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/scheduled-posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadPosts();
      } else {
        const data = await res.json();
        alert(data?.error ?? 'Failed to cancel.');
      }
    } finally {
      setCancellingId(null);
    }
  }

  const upcoming = posts.filter((p) => p.status === 'scheduled' || p.status === 'posting');
  const history  = posts.filter((p) => p.status === 'posted' || p.status === 'failed' || p.status === 'cancelled');

  return (
    <>
      {/* Connected accounts grid */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Connected accounts</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {PLATFORMS.map((p) => {
            const isConnected = connectedSet.has(p.id);
            return (
              <div
                key={p.id}
                className={
                  'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center text-xs ' +
                  (isConnected
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-zinc-800 bg-zinc-900/40')
                }
              >
                <Plug className={'h-4 w-4 ' + (isConnected ? 'text-emerald-400' : 'text-zinc-500')} />
                <span className="font-medium text-zinc-300">{p.label}</span>
                <span className={'text-[10px] uppercase tracking-wide ' + (isConnected ? 'text-emerald-400' : 'text-zinc-500')}>
                  {isConnected ? 'Connected' : 'Not yet'}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Connect flows arrive as each platform's API approval lands.
        </p>
      </section>

      {/* Action bar */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Upcoming ({upcoming.length})</h2>
        <button
          onClick={() => setComposerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400"
        >
          <Plus className="h-3.5 w-3.5" /> New post
        </button>
      </div>

      {/* Upcoming list */}
      {loading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">No scheduled posts yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Hit "New post" to draft your first one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30">
          {upcoming.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              results={resultsByPost[post.id] ?? []}
              onCancel={() => cancelPost(post.id)}
              isCancelling={cancellingId === post.id}
            />
          ))}
        </ul>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">History</h2>
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30">
            {history.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                results={resultsByPost[post.id] ?? []}
                onCancel={() => {}}
                isCancelling={false}
                isHistory
              />
            ))}
          </ul>
        </section>
      )}

      <PostComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={() => void loadPosts()}
        connectedPlatforms={connectedSet}
        products={products}
      />
    </>
  );
}

interface PostRowProps {
  post: ScheduledPost;
  results: PostResult[];
  onCancel: () => void;
  isCancelling: boolean;
  isHistory?: boolean;
}

function PostRow({ post, results, onCancel, isCancelling, isHistory }: PostRowProps) {
  const cover = post.media[0];
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {cover ? (
        cover.type === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
        ) : (
          <video src={cover.url} className="h-12 w-12 shrink-0 rounded-md object-cover" muted />
        )
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-md bg-zinc-800" />
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-zinc-200">
          {post.caption || <span className="text-zinc-500 italic">(no caption)</span>}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {new Date(post.scheduled_for).toLocaleString()}{' '}
          · {post.platforms.join(', ')}
        </p>
        {results.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {results.map((r) => (
              <span
                key={r.platform}
                className={
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ' +
                  (r.status === 'posted'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : r.status === 'failed'
                    ? 'bg-red-500/15 text-red-300'
                    : 'bg-zinc-800 text-zinc-400')
                }
                title={r.error_message ?? undefined}
              >
                {r.platform}: {r.status}
                {r.platform_post_url && (
                  <a href={r.platform_post_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={
            'rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ' +
            (post.status === 'posted'
              ? 'bg-emerald-500/15 text-emerald-300'
              : post.status === 'failed'
              ? 'bg-red-500/15 text-red-300'
              : post.status === 'cancelled'
              ? 'bg-zinc-800 text-zinc-500'
              : 'bg-indigo-500/15 text-indigo-300')
          }
        >
          {post.status}
        </span>
        {!isHistory && post.status === 'scheduled' && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            title="Cancel post"
          >
            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </li>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/supabase';
import { CalendarClock, Plug, ArrowRight, Sparkles } from 'lucide-react';

export const metadata = { title: 'Schedule' };

const PLATFORMS: Array<{ id: string; label: string }> = [
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'threads',   label: 'Threads' },
  { id: 'facebook',  label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'twitter',   label: 'X' },
];

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const profile = profileData as Profile | null;
  if (!profile) redirect('/login');

  // Pro gate
  if (profile.subscription_tier !== 'pro') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-zinc-100">Schedule is a Pro feature</h1>
          <p className="mb-6 text-sm text-zinc-400">
            Schedule and auto-publish across 7 platforms — Instagram, TikTok, X, YouTube,
            LinkedIn, Threads, and Facebook Pages.
          </p>
          <Link
            href="/dashboard/settings/billing?upgrade=schedule"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Upgrade to Pro <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Pull stats + connected accounts + upcoming posts.
  const [postsRes, accountsRes] = await Promise.all([
    (supabase as unknown as { from: (t: string) => { select: (s: string, opts: { count: 'exact' }) => { eq: (k: string, v: string) => Promise<{ count: number | null }> } } })
      .from('scheduled_posts')
      .select('id', { count: 'exact' })
      .eq('creator_id', user.id),
    (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (k: string, v: string) => Promise<{ data: { platform: string }[] | null }> } } })
      .from('social_accounts')
      .select('platform')
      .eq('creator_id', user.id),
  ]);

  const connected = new Set((accountsRes.data ?? []).map((a) => a.platform));

  const { data: upcomingData } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => {
            order: (k: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: UpcomingPost[] | null }>
            }
          }
        }
      }
    }
  })
    .from('scheduled_posts')
    .select('id,caption,scheduled_for,platforms,status')
    .eq('creator_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(10);

  const upcoming = upcomingData ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
            <CalendarClock className="h-4 w-4" /> Schedule
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Plan your posts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Schedule one post across every channel. UTM tags auto-applied to your cele.bio links.
          </p>
        </div>
        <button
          disabled
          className="cursor-not-allowed rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-500"
          title="Composer arrives in the next update"
        >
          New post (soon)
        </button>
      </div>

      {/* Connected accounts grid */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Connected accounts</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {PLATFORMS.map((p) => {
            const isConnected = connected.has(p.id);
            return (
              <div
                key={p.id}
                className={
                  'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center text-xs ' +
                  (isConnected
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-500')
                }
              >
                <Plug className="h-4 w-4" />
                <span className="font-medium text-zinc-300">{p.label}</span>
                <span className="text-[10px] uppercase tracking-wide">
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

      {/* Upcoming posts */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">
          Upcoming ({postsRes.count ?? 0})
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">No scheduled posts yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              The composer ships next. Once it does, you'll draft a post here and pick when it goes live.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30">
            {upcoming.map((post) => (
              <li key={post.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-zinc-200">{post.caption || '(no caption)'}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {new Date(post.scheduled_for).toLocaleString()} · {post.platforms.join(', ')}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {post.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface UpcomingPost {
  id: string;
  caption: string;
  scheduled_for: string;
  platforms: string[];
  status: string;
}

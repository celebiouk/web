import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/supabase';
import { CalendarClock, ArrowRight, Sparkles } from 'lucide-react';
import { ScheduleClient } from '@/components/dashboard/schedule/ScheduleClient';

export const metadata = { title: 'Schedule' };

type PlatformId =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'threads'
  | 'facebook';

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

  // Connected accounts (which platforms can be selected in the composer).
  const { data: accountRows } = await (supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => Promise<{ data: ConnectedAccount[] | null }>
        }
      }
    }
  })
    .from('social_accounts')
    .select('id,platform,platform_username,display_name')
    .eq('creator_id', user.id)
    .eq('status', 'active');

  const accounts = (accountRows ?? []) as ConnectedAccount[];

  // Promotable products for the composer dropdown.
  const { data: products } = await supabase
    .from('products')
    .select('id,title')
    .eq('creator_id', user.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
          <CalendarClock className="h-4 w-4" /> Schedule
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Plan your posts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Schedule one post across every channel. UTM tags auto-applied to your cele.bio links.
        </p>
      </div>

      <ScheduleClient
        accounts={accounts}
        products={(products ?? []) as { id: string; title: string }[]}
      />
    </div>
  );
}

interface ConnectedAccount {
  id: string;
  platform: PlatformId;
  platform_username: string | null;
  display_name: string | null;
}

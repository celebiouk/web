import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Mail, Users, Send, Zap, FileText, ArrowRight, Sparkles } from 'lucide-react';
import type { Profile } from '@/types/supabase';

export const metadata = { title: 'Email Marketing' };

export default async function EmailMarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const profile = profileData as Profile | null;
  if (!profile) redirect('/login');

  const isPro = profile.subscription_tier === 'pro';
  const FREE_LIMIT = 500;

  // Live stats — use `as any` because these tables aren't in generated types yet.
  const [
    { count: activeCount },
    { count: sentCount },
    { count: thisMonthCount },
  ] = await Promise.all([
    (supabase as any)
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('is_active', true),
    (supabase as any)
      .from('email_broadcasts')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('status', 'sent'),
    (supabase as any)
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .gte('subscribed_at', new Date(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        1
      )).toISOString()),
  ]);

  const subscribers = activeCount ?? 0;
  const broadcasts  = sentCount ?? 0;
  const newThisMonth = thisMonthCount ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
          <Mail className="h-4 w-4" /> Email Marketing
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Grow your audience</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Send broadcasts, automate sequences, and manage your subscriber list.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs text-zinc-500">Active subscribers</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {subscribers.toLocaleString()}
            {!isPro && (
              <span className="ml-2 text-sm font-normal text-zinc-500">/ {FREE_LIMIT}</span>
            )}
          </p>
          {!isPro && subscribers >= FREE_LIMIT * 0.9 && (
            <p className="mt-0.5 text-[11px] text-amber-400">
              Approaching free limit — <Link href="/dashboard/settings/billing" className="underline">upgrade to Pro</Link>
            </p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs text-zinc-500">Broadcasts sent</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{broadcasts.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs text-zinc-500">New this month</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {newThisMonth > 0 ? `+${newThisMonth.toLocaleString()}` : '0'}
          </p>
        </div>
      </div>

      {/* Free tier cap warning */}
      {!isPro && subscribers >= FREE_LIMIT && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-amber-300">Subscriber cap reached</p>
          <p className="mt-0.5 text-zinc-400">
            New subscribers can&apos;t be added until you{' '}
            <Link href="/dashboard/settings/billing?upgrade=email" className="text-amber-300 underline">
              upgrade to Pro
            </Link>{' '}
            (unlimited subscribers).
          </p>
        </div>
      )}

      {/* Nav cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <NavCard
          href="/dashboard/email/broadcasts"
          icon={<Send className="h-5 w-5 text-indigo-400" />}
          title="Broadcasts"
          description="Send one-time campaigns to all or a segment of your list."
          cta="Send a broadcast"
        />
        <NavCard
          href="/dashboard/email/subscribers"
          icon={<Users className="h-5 w-5 text-indigo-400" />}
          title="Subscribers"
          description="Search, tag, import, export, and manage your list."
          cta="Manage subscribers"
        />
        <NavCard
          href="/dashboard/email/sequences"
          icon={<Zap className="h-5 w-5 text-indigo-400" />}
          title="Sequences"
          description="Automated drip flows triggered by signups, purchases, and bookings."
          cta="Build a sequence"
          requiresPro={!isPro}
        />
        <NavCard
          href="/dashboard/email/forms"
          icon={<FileText className="h-5 w-5 text-indigo-400" />}
          title="Opt-in Form"
          description="Customise your storefront email capture and lead magnet offer."
          cta="Edit form"
        />
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  description,
  cta,
  requiresPro,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  requiresPro?: boolean;
}) {
  return (
    <Link
      href={requiresPro ? '/dashboard/settings/billing?upgrade=sequences' : href}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/60"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
          {icon}
        </div>
        {requiresPro && (
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
            <Sparkles className="h-2.5 w-2.5" /> Pro
          </span>
        )}
      </div>
      <div>
        <p className="font-medium text-zinc-100">{title}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition group-hover:gap-2">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

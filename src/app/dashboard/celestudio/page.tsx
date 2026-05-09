import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DESIGN_SYSTEM_LIST } from '@/lib/celestudio/design-systems';
import { Sparkles, ArrowRight, Plus, BookOpen, Lock } from 'lucide-react';
import { CelestudioListClient } from './client';

export const dynamic = 'force-dynamic';

export default async function CelestudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any).from('profiles')
    .select('subscription_tier, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const isPro = profile?.subscription_tier === 'pro';

  const { data: ebooks } = await (supabase as any).from('celestudio_ebooks')
    .select('id, title, subtitle, design_system, status, updated_at')
    .eq('creator_id', user.id)
    .order('updated_at', { ascending: false });

  const hasEbooks = (ebooks?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-zinc-900 p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" strokeWidth={2} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">CeleStudio</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl">
            Turn plain text into <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">stunning ebooks</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Paste your raw content. Pick a design system. Watch AI compose a premium digital publication ready to sell on Cele.bio.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {isPro ? (
              <Link
                href="/dashboard/celestudio/new"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create New Ebook
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Link>
            ) : (
              <Link
                href="/dashboard/settings?tab=billing"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              >
                <Lock className="h-4 w-4" strokeWidth={2.5} />
                Unlock with Pro
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Link>
            )}
            <span className="text-sm text-zinc-500">
              {DESIGN_SYSTEM_LIST.length} premium design systems · AI-generated · Ready in seconds
            </span>
          </div>
        </div>
      </div>

      {/* Pro gate explanation for free users */}
      {!isPro && (
        <div className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-amber-200">Pro plan unlocks CeleStudio</h3>
              <p className="mt-1 text-sm text-amber-200/70">
                CeleStudio is available exclusively to creators on the Pro plan. Upgrade for $19.99/mo to generate unlimited premium ebooks, plus all other Pro features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Design systems showcase */}
      <div className="mb-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Design Systems</h2>
            <p className="mt-1 text-sm text-zinc-500">Six premium publishing styles. Each one transforms your text differently.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGN_SYSTEM_LIST.map(ds => (
            <div
              key={ds.slug}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 transition-all hover:border-zinc-700"
            >
              <div
                className="relative h-40 w-full"
                style={{ background: ds.previewGradient }}
              >
                <div className="absolute inset-x-5 inset-y-4 flex flex-col justify-between">
                  <div className="h-1.5 w-16 rounded-full" style={{ background: ds.dark.accent, opacity: 0.7 }} />
                  <div>
                    <div
                      className="text-base font-semibold"
                      style={{ color: ds.dark.text, fontFamily: ds.fontHeading, letterSpacing: ds.letterSpacingHeading }}
                    >
                      The Quiet Edition
                    </div>
                    <div
                      className="mt-1 text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: ds.dark.accent }}
                    >
                      {ds.tagline}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-zinc-100">{ds.name}</h3>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{ds.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ebooks list */}
      <div>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Your Ebooks</h2>
          {isPro && hasEbooks && (
            <Link
              href="/dashboard/celestudio/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New Ebook
            </Link>
          )}
        </div>

        {hasEbooks ? (
          <CelestudioListClient ebooks={ebooks ?? []} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60">
              <BookOpen className="h-5 w-5 text-zinc-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-zinc-300">No ebooks yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              {isPro ? 'Click Create New Ebook above to get started' : 'Upgrade to Pro to start creating'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

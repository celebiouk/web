import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/supabase';
import {
  Palette,
  ExternalLink,
  ArrowRight,
  Check,
  User,
  ShoppingBag,
  Calendar,
  GraduationCap,
  Paintbrush,
  Package,
  Sparkles,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'My Page',
};

/**
 * My Page - Sales Page Studio
 * Premium design with conversion-focused layout
 */
export default async function MyPagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = profileData as Profile | null;

  const [{ count: productsCount }, { count: publishedProductsCount }, { count: coachingCount }, { count: coursesCount }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', user.id).eq('is_published', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', user.id).eq('type', 'coaching').eq('is_published', true),
    (supabase.from('courses') as any).select('id', { count: 'exact', head: true }).eq('creator_id', user.id).eq('status', 'published'),
  ]);

  const studioChecklist = [
    {
      label: 'Brand identity (name + avatar + bio)',
      done: Boolean(profile?.full_name && profile?.bio && profile?.avatar_url),
      href: '/dashboard/page-editor',
      icon: User,
    },
    {
      label: 'Template and visual style',
      done: Boolean(profile?.template_id),
      href: '/dashboard/page-editor',
      icon: Palette,
    },
    {
      label: 'Theme customization',
      done: true,
      href: '/dashboard/customize',
      icon: Paintbrush,
    },
    {
      label: 'Published offers on page',
      done: (publishedProductsCount || 0) > 0 || (coursesCount || 0) > 0,
      href: '/dashboard/products',
      icon: Package,
    },
  ];

  const completedStudioItems = studioChecklist.filter((item) => item.done).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
              Page Studio
            </h1>
            <p className="mt-2 text-[13px] text-zinc-500">
              Build a high-converting sales page with live preview, polished branding, and offer-ready sections.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/page-editor"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              Edit Page
            </Link>
            <Link
              href="/dashboard/customize"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[13px] font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800"
            >
              <Palette className="h-4 w-4" strokeWidth={1.75} />
              Colors & Fonts
            </Link>
            {profile?.username && (
              <Link
                href={`/${profile.username}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[13px] font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                View Live
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Offers" value={productsCount || 0} />
        <StatCard label="Published Offers" value={publishedProductsCount || 0} />
        <StatCard label="Coaching Offers" value={coachingCount || 0} />
        <StatCard label="Published Courses" value={coursesCount || 0} />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        {/* Sales Page Readiness */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#111113]">
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-zinc-100">Sales Page Readiness</h2>
            <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-400">
              {completedStudioItems}/{studioChecklist.length} complete
            </span>
          </div>
          <div className="space-y-2 p-3">
            {studioChecklist.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/60 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        item.done
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      )}
                    >
                      {item.done ? (
                        <Check className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-zinc-200">{item.label}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Shortcuts */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#111113]">
          <div className="border-b border-zinc-800/60 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-zinc-100">Section Shortcuts</h2>
          </div>
          <div className="space-y-2 p-3">
            <SectionShortcut
              icon={User}
              title="Hero Section"
              description="Name, headline, and trust-building intro"
              href="/dashboard/settings"
            />
            <SectionShortcut
              icon={ShoppingBag}
              title="Offers & Pricing"
              description="Digital products, bundles, and checkout-ready cards"
              href="/dashboard/products"
            />
            <SectionShortcut
              icon={Calendar}
              title="Bookings / Coaching"
              description="Publish sessions and configure availability"
              href="/dashboard/bookings"
            />
            <SectionShortcut
              icon={GraduationCap}
              title="Courses Section"
              description="Add curriculum offers for Pro monetization"
              href="/dashboard/courses"
            />
            <SectionShortcut
              icon={Paintbrush}
              title="Visual Design"
              description="Color system, typography, and dark mode"
              href="/dashboard/customize"
            />
          </div>
        </div>
      </div>

      {/* CTA Card */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
              <Sparkles className="h-5 w-5 text-indigo-400" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-200">
                Want this to look like a true sales page?
              </h2>
              <p className="mt-1 text-[13px] text-zinc-500">
                Start in Live Preview, click any editable section, then publish offers with clear outcomes and strong CTAs.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/preview"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              <Eye className="h-4 w-4" strokeWidth={1.75} />
              Live Preview
            </Link>
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Add Offer
            </Link>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-5">
      <p className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function SectionShortcut({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof User;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-zinc-800/60 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-400 transition-colors group-hover:bg-zinc-700/80 group-hover:text-zinc-300">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-zinc-200 group-hover:text-white">{title}</p>
        <p className="text-[12px] text-zinc-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
    </Link>
  );
}

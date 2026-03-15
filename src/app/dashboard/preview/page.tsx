'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { 
  Sparkles, 
  Flame, 
  BookOpen, 
  Moon, 
  Sun, 
  Briefcase, 
  PartyPopper, 
  Newspaper, 
  Terminal, 
  Crown,
  Palette,
  type LucideIcon
} from 'lucide-react';
import type { CreatorPageData, PageTheme, TemplateSlug } from '@/types/creator-page';
import type { Profile, Product } from '@/types/supabase';

// All available templates
const TEMPLATES: { slug: TemplateSlug; name: string; description: string }[] = [
  { slug: 'minimal-clean', name: 'Minimal Clean', description: 'Clean white, elegant serif' },
  { slug: 'bold-creator', name: 'Bold Creator', description: 'Big gradients, high impact' },
  { slug: 'course-academy', name: 'Course Academy', description: 'Courses-first layout' },
  { slug: 'dark-premium', name: 'Dark Premium', description: 'Dark theme, gold accents' },
  { slug: 'warm-approachable', name: 'Warm Approachable', description: 'Soft colors, friendly' },
  { slug: 'corporate-pro', name: 'Corporate Pro', description: 'Professional, trust-building' },
  { slug: 'vibrant-social', name: 'Vibrant Social', description: 'Gen-Z colorful aesthetic' },
  { slug: 'editorial', name: 'Editorial', description: 'Magazine-style layout' },
  { slug: 'tech-vibe', name: 'Tech Vibe', description: 'Dark mode, terminal style' },
  { slug: 'luxury', name: 'Luxury', description: 'Black & gold, high-ticket' },
];

type ViewMode = 'mobile' | 'desktop';

/**
 * Dashboard Preview Page
 * Live preview of creator's page with template switching
 */
export default function DashboardPreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<CreatorPageData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSlug>('minimal-clean');
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch creator data
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      const profile = profileData as Profile & { template_slug?: string };
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      const products = (productsData || []) as Product[];

      // Find coaching product
      const coachingProduct = products.find(p => p.type === 'coaching');

      // Fetch courses
      const { data: coursesData } = await (supabase.from('courses') as any)
        .select('id, title, slug, subtitle, cover_image_url, price_cents, student_count')
        .eq('creator_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      const coursesList = (coursesData || []) as Array<{
        id: string; title: string; slug: string; subtitle: string | null;
        cover_image_url: string | null; price_cents: number; student_count: number;
      }>;

      // Get lesson counts for each course
      const coursesWithCounts = await Promise.all(
        coursesList.map(async (c) => {
          const { count } = await (supabase.from('course_lessons') as any)
            .select('id', { count: 'exact', head: true })
            .eq('course_id', c.id);
          return {
            ...c,
            lesson_count: count || 0,
            creator_username: profile.username || '',
          };
        })
      );

      // Build page data
      const data: CreatorPageData = {
        profile: {
          id: profile.id,
          full_name: profile.full_name || '',
          username: profile.username || '',
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          banner_url: (profile as any).banner_url || null,
          subscription_tier: profile.subscription_tier,
          social_links: (profile as Record<string, unknown>).social_links as CreatorPageData['profile']['social_links'] || [],
          testimonials_enabled: (profile as any).testimonials_enabled ?? false,
        },
        products: products.filter(p => p.type !== 'coaching').map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: Number(p.price),
          cover_image_url: p.cover_image_url,
          type: p.type as 'digital' | 'course' | 'coaching',
          is_published: p.is_published,
        })),
        coaching: coachingProduct ? {
          id: coachingProduct.id,
          title: coachingProduct.title,
          description: coachingProduct.description,
          price: Number(coachingProduct.price),
          duration_minutes: (coachingProduct as Record<string, unknown>).duration_minutes as number || 60,
          is_published: coachingProduct.is_published,
        } : null,
        courses: coursesWithCounts,
        theme: ((profile as Record<string, unknown>).page_theme as PageTheme) || {
          primary_color: '#0D1B2A',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          font_family: 'inter',
        },
      };

      setPageData(data);
      setSelectedTemplate(profile.template_slug as TemplateSlug || 'minimal-clean');
      setLoading(false);
    }

    fetchData();
  }, [router]);

  // Handle template change
  const handleTemplateChange = useCallback(async (slug: TemplateSlug) => {
    setSelectedTemplate(slug);
    setShowTemplates(false);
  }, []);

  // Save template selection
  const handleSaveTemplate = useCallback(async () => {
    if (!pageData) return;
    
    setIsSaving(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> } } })
        .from('profiles')
        .update({ template_slug: selectedTemplate })
        .eq('id', user.id);

      // Show success feedback (you could add a toast here)
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  }, [pageData, selectedTemplate]);

  // Handle section edit clicks (in preview mode)
  const handleSectionClick = useCallback((section: 'hero' | 'products' | 'coaching' | 'testimonials' | 'courses') => {
    // Navigate to the appropriate edit page
    switch (section) {
      case 'hero':
        router.push('/dashboard/settings');
        break;
      case 'products':
        router.push('/dashboard/products');
        break;
      case 'coaching':
        router.push('/dashboard/bookings');
        break;
      case 'courses':
        router.push('/dashboard/courses');
        break;
      case 'testimonials':
        // Future: testimonials page
        break;
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Unable to load page data</p>
        <button
          onClick={() => router.refresh()}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Preview
          </h1>
          <p className="text-sm text-gray-500">
            Preview your page and switch templates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('mobile')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              📱 Mobile
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              💻 Desktop
            </button>
          </div>

          {/* Public Page Link */}
          {pageData.profile.username && (
            <Link
              href={`/${pageData.profile.username}`}
              target="_blank"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              View Public Page →
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Preview Panel */}
        <div className="relative rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-900">
          {/* Phone Frame for Mobile */}
          {viewMode === 'mobile' ? (
            <div className="mx-auto w-fit">
              {/* Phone mockup container */}
              <div className="relative mx-auto h-[680px] w-[340px] rounded-[2.5rem] border-[14px] border-gray-800 bg-gray-800 p-1 shadow-xl dark:border-gray-700">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 z-10 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-800 dark:bg-gray-700" />
                {/* Screen */}
                <div className="h-full w-full overflow-auto rounded-[1.5rem] bg-white">
                  <Suspense fallback={<MobilePreviewSkeleton />}>
                    <TemplateRenderer
                      templateSlug={selectedTemplate}
                      data={pageData}
                      isPreview={true}
                      onSectionClick={handleSectionClick}
                      showPoweredBy={pageData.profile.subscription_tier !== 'pro'}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Preview */
            <div className="mx-auto max-h-[700px] max-w-4xl overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700">
              <Suspense fallback={<DesktopPreviewSkeleton />}>
                <TemplateRenderer
                  templateSlug={selectedTemplate}
                  data={pageData}
                  isPreview={true}
                  onSectionClick={handleSectionClick}
                  showPoweredBy={pageData.profile.subscription_tier !== 'pro'}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Template Picker Panel */}
        <div className="space-y-4">
          {/* Current Template Card */}
          <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Current Template
              </h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                {showTemplates ? 'Close' : 'Change'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                🎨
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {TEMPLATES.find(t => t.slug === selectedTemplate)?.name || 'Minimal Clean'}
                </p>
                <p className="text-sm text-gray-500">
                  {TEMPLATES.find(t => t.slug === selectedTemplate)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Template Grid (expandable) */}
          {showTemplates && (
            <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                All Templates
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((template) => {
                  const TemplateIcon = getTemplateIcon(template.slug);
                  return (
                  <button
                    key={template.slug}
                    onClick={() => handleTemplateChange(template.slug)}
                    className={`group rounded-xl border-2 p-3 text-left transition-all ${
                      selectedTemplate === template.slug
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-primary/50 dark:border-gray-800'
                    }`}
                  >
                    <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                      <TemplateIcon className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                    </div>
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {template.description}
                    </p>
                    {selectedTemplate === template.slug && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                        <span>✓</span> Active
                      </div>
                    )}
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/customize"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>🎨 Customize Theme</span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/dashboard/products"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>📦 Edit Products</span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>⚙️ Edit Profile</span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to get icon for template
function getTemplateIcon(slug: TemplateSlug): LucideIcon {
  const icons: Record<TemplateSlug, LucideIcon> = {
    'minimal-clean': Sparkles,
    'bold-creator': Flame,
    'course-academy': BookOpen,
    'dark-premium': Moon,
    'warm-approachable': Sun,
    'corporate-pro': Briefcase,
    'vibrant-social': PartyPopper,
    'editorial': Newspaper,
    'tech-vibe': Terminal,
    'luxury': Crown,
  };
  return icons[slug] || Palette;
}

// Loading skeleton for mobile preview
function MobilePreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="mx-auto h-24 w-24 rounded-full bg-gray-200" />
      <div className="space-y-3">
        <div className="mx-auto h-6 w-40 rounded bg-gray-200" />
        <div className="mx-auto h-4 w-60 rounded bg-gray-200" />
      </div>
      <div className="h-12 w-full rounded-lg bg-gray-200" />
      <div className="space-y-4">
        <div className="h-32 w-full rounded-lg bg-gray-200" />
        <div className="h-32 w-full rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

// Loading skeleton for desktop preview
function DesktopPreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-8 p-8">
      <div className="flex items-center gap-6">
        <div className="h-28 w-28 rounded-full bg-gray-200" />
        <div className="space-y-3">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="h-48 rounded-lg bg-gray-200" />
        <div className="h-48 rounded-lg bg-gray-200" />
        <div className="h-48 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

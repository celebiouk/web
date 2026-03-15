'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { Input, Textarea, Button, Avatar, Spinner } from '@/components/ui';
import { uploadFile, validateFile, FILE_TYPES } from '@/lib/utils/uploadFile';
import { 
  Sparkles, Flame, BookOpen, Moon, Sun, Briefcase, 
  PartyPopper, Newspaper, Terminal, Crown, Palette,
  Camera, Check, ExternalLink, Smartphone, Monitor,
  type LucideIcon
} from 'lucide-react';
import type { CreatorPageData, PageTheme, TemplateSlug } from '@/types/creator-page';
import type { Profile, Product } from '@/types/supabase';

// All available templates
const TEMPLATES: { slug: TemplateSlug; name: string; icon: LucideIcon }[] = [
  { slug: 'minimal-clean', name: 'Minimal Clean', icon: Sparkles },
  { slug: 'bold-creator', name: 'Bold Creator', icon: Flame },
  { slug: 'course-academy', name: 'Course Academy', icon: BookOpen },
  { slug: 'dark-premium', name: 'Dark Premium', icon: Moon },
  { slug: 'warm-approachable', name: 'Warm & Friendly', icon: Sun },
  { slug: 'corporate-pro', name: 'Corporate Pro', icon: Briefcase },
  { slug: 'vibrant-social', name: 'Vibrant Social', icon: PartyPopper },
  { slug: 'editorial', name: 'Editorial', icon: Newspaper },
  { slug: 'tech-vibe', name: 'Tech Vibe', icon: Terminal },
  { slug: 'luxury', name: 'Luxury', icon: Crown },
];

type ViewMode = 'mobile' | 'desktop';

export default function PageEditorPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pageData, setPageData] = useState<CreatorPageData | null>(null);
  
  // Edit states - these update the live preview instantly
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSlug>('minimal-clean');
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(false);
  const [showAvatarOnBanner, setShowAvatarOnBanner] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  // File uploads
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  // UI states
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
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

      const prof = profileData as Profile & { template_slug?: string };
      setProfile(prof);
      
      // Initialize edit states
      setFullName(prof.full_name || '');
      setBio(prof.bio || '');
      setSelectedTemplate((prof as any).template_slug as TemplateSlug || 'minimal-clean');
      setTestimonialsEnabled((prof as any).testimonials_enabled ?? false);
      setShowAvatarOnBanner((prof as any).show_avatar_on_banner ?? true);
      setAvatarPreview(prof.avatar_url);
      setBannerPreview((prof as any).banner_url);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      const products = (productsData || []) as Product[];
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

      const coursesWithCounts = await Promise.all(
        coursesList.map(async (c) => {
          const { count } = await (supabase.from('course_lessons') as any)
            .select('id', { count: 'exact', head: true })
            .eq('course_id', c.id);
          return { ...c, lesson_count: count || 0, creator_username: prof.username || '' };
        })
      );

      // Build page data
      const data: CreatorPageData = {
        profile: {
          id: prof.id,
          full_name: prof.full_name || '',
          username: prof.username || '',
          bio: prof.bio,
          avatar_url: prof.avatar_url,
          banner_url: (prof as any).banner_url || null,
          show_avatar_on_banner: (prof as any).show_avatar_on_banner ?? true,
          subscription_tier: prof.subscription_tier,
          social_links: (prof as any).social_links || [],
          testimonials_enabled: (prof as any).testimonials_enabled ?? false,
        },
        products: products.filter(p => p.type !== 'coaching').map(p => ({
          id: p.id,
          title: p.title,
          subtitle: (p as any).subtitle || null,
          description: p.description,
          price: Number(p.price),
          cover_image_url: p.cover_image_url,
          header_banner_url: (p as any).header_banner_url || null,
          type: p.type as 'digital' | 'course' | 'coaching',
          is_published: p.is_published,
        })),
        coaching: coachingProduct ? {
          id: coachingProduct.id,
          title: coachingProduct.title,
          description: coachingProduct.description,
          price: Number(coachingProduct.price),
          duration_minutes: (coachingProduct as any).duration_minutes || 60,
          is_published: coachingProduct.is_published,
        } : null,
        courses: coursesWithCounts,
        theme: ((prof as any).page_theme as PageTheme) || {
          primary_color: '#0D1B2A',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          font_family: 'inter',
        },
      };

      setPageData(data);
      setLoading(false);
    }

    fetchData();
  }, [router, supabase]);

  // Live preview data - updates whenever edit states change
  const livePageData: CreatorPageData | null = pageData ? {
    ...pageData,
    profile: {
      ...pageData.profile,
      full_name: fullName,
      bio: bio,
      avatar_url: avatarPreview,
      banner_url: bannerPreview,
      show_avatar_on_banner: showAvatarOnBanner,
      testimonials_enabled: testimonialsEnabled,
    },
  } : null;

  // Track changes
  useEffect(() => {
    if (!profile) return;
    const changed = 
      fullName !== (profile.full_name || '') ||
      bio !== (profile.bio || '') ||
      selectedTemplate !== ((profile as any).template_slug || 'minimal-clean') ||
      testimonialsEnabled !== ((profile as any).testimonials_enabled ?? false) ||
      showAvatarOnBanner !== ((profile as any).show_avatar_on_banner ?? true) ||
      avatarFile !== null ||
      bannerFile !== null;
    setHasChanges(changed);
  }, [fullName, bio, selectedTemplate, testimonialsEnabled, showAvatarOnBanner, avatarFile, bannerFile, profile]);

  // Handle avatar selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file, { maxSize: 5 * 1024 * 1024, allowedTypes: FILE_TYPES.images });
    if (!validation.valid) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Handle banner selection
  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file, { maxSize: 10 * 1024 * 1024, allowedTypes: FILE_TYPES.images });
    if (!validation.valid) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  // Save all changes
  const handleSave = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      let avatarUrl = avatarPreview;
      let bannerUrl = bannerPreview;

      // Upload avatar if changed
      if (avatarFile) {
        const result = await uploadFile('avatars', avatarFile, { folder: profile.id });
        avatarUrl = result.publicUrl || null;
      }

      // Upload banner if changed
      if (bannerFile) {
        const result = await uploadFile('banners', bannerFile, { folder: profile.id });
        bannerUrl = result.publicUrl || null;
      }

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          template_slug: selectedTemplate,
          testimonials_enabled: testimonialsEnabled,
          show_avatar_on_banner: showAvatarOnBanner,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      // Clear file states
      setAvatarFile(null);
      setBannerFile(null);
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Hide success after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [profile, avatarFile, bannerFile, fullName, bio, selectedTemplate, testimonialsEnabled, showAvatarOnBanner, avatarPreview, bannerPreview, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pageData || !livePageData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Unable to load page data</p>
        <Button onClick={() => router.refresh()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Page Editor
          </h1>
          <p className="text-sm text-gray-500">
            Edit your page and see changes live
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>
          </div>

          {/* View Live */}
          {profile?.username && (
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ExternalLink className="h-4 w-4" />
              View Live
            </Link>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-6">
            {/* Template Selector */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Template
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.slug;
                  return (
                    <button
                      key={template.slug}
                      onClick={() => setSelectedTemplate(template.slug)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                          : 'border-gray-100 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {template.name}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-brand-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Profile
              </h3>

              {/* Avatar */}
              <div className="flex items-center gap-3">
                <label className="group relative cursor-pointer">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <Avatar name={fullName || 'User'} size="lg" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                </label>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">Profile Photo</p>
                  <p className="text-gray-500">Click to change</p>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Banner Image
                </label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Standard header ratio is 16:9. Recommended size: 1920 × 1080.
                </p>
                <label className="group relative block cursor-pointer">
                  <div className={`relative h-20 w-full overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                    bannerPreview ? 'border-transparent' : 'border-gray-300 hover:border-gray-400 dark:border-gray-700'
                  }`}>
                    {bannerPreview ? (
                      <>
                        <Image src={bannerPreview} alt="Banner" fill className="object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Camera className="mr-2 h-4 w-4" />
                        <span className="text-sm">Add banner</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                />
              </div>

              {/* Testimonials Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Testimonials</p>
                  <p className="text-xs text-gray-500">Show on your page</p>
                </div>
                <button
                  onClick={() => setTestimonialsEnabled(!testimonialsEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    testimonialsEnabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      testimonialsEnabled ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                    style={{ transform: testimonialsEnabled ? 'translateX(18px)' : 'translateX(4px)' }}
                  />
                </button>
              </div>

              {/* Avatar on Header Banner Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Avatar on Header Banner</p>
                  <p className="text-xs text-gray-500">Place avatar at bottom-center of banner</p>
                </div>
                <button
                  onClick={() => setShowAvatarOnBanner(!showAvatarOnBanner)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showAvatarOnBanner ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      showAvatarOnBanner ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                    style={{ transform: showAvatarOnBanner ? 'translateX(18px)' : 'translateX(4px)' }}
                  />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Page Content
              </h3>
              <Link
                href="/dashboard/products"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>📦 Products</span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/dashboard/courses"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>🎓 Courses</span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/dashboard/bookings"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>📅 Coaching</span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/dashboard/customize"
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span>🎨 Colors & Fonts</span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6 dark:bg-gray-950">
          <div className="mx-auto">
            {viewMode === 'mobile' ? (
              // Phone Frame
              <div className="mx-auto w-fit">
                <div className="relative mx-auto h-[680px] w-[340px] rounded-[2.5rem] border-[14px] border-gray-800 bg-gray-800 p-1 shadow-xl dark:border-gray-700">
                  <div className="absolute left-1/2 top-0 z-10 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-800 dark:bg-gray-700" />
                  <div className="h-full w-full overflow-auto rounded-[1.5rem] bg-white">
                    <Suspense fallback={<PreviewSkeleton />}>
                      <TemplateRenderer
                        templateSlug={selectedTemplate}
                        data={livePageData}
                        isPreview={true}
                        showPoweredBy={livePageData.profile.subscription_tier !== 'pro'}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            ) : (
              // Desktop Frame
              <div className="mx-auto max-h-[700px] max-w-4xl overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700">
                <Suspense fallback={<PreviewSkeleton />}>
                  <TemplateRenderer
                    templateSlug={selectedTemplate}
                    data={livePageData}
                    isPreview={true}
                    showPoweredBy={livePageData.profile.subscription_tier !== 'pro'}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSkeleton() {
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

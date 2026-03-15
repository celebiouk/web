'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Check, Eye, X, Sparkles } from 'lucide-react';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import type { Template } from '@/types/supabase';
import type { CreatorPageData, TemplateSlug } from '@/types/creator-page';

interface TemplateGridProps {
  templates: Template[];
  selectedTemplateId: string | null;
}

// Sample data for template previews
const PREVIEW_DATA: CreatorPageData = {
  profile: {
    id: 'preview',
    username: 'yourname',
    full_name: 'Your Name',
    bio: 'Creator, coach, and digital product maker helping you grow your business.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    social_links: [
      { platform: 'instagram', url: '#' },
      { platform: 'twitter', url: '#' },
      { platform: 'youtube', url: '#' },
    ],
    subscription_tier: 'pro',
  },
  products: [
    {
      id: '1',
      title: 'Ultimate Creator Guide',
      description: 'Everything you need to start making money online',
      price: 49,
      type: 'digital',
      cover_image_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop',
      is_published: true,
    },
    {
      id: '2',
      title: 'Video Editing Masterclass',
      description: 'Learn professional video editing from scratch',
      price: 99,
      type: 'course',
      cover_image_url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
      is_published: true,
    },
  ],
  coaching: {
    id: 'coaching-1',
    title: '1:1 Strategy Call',
    description: 'Personal coaching session to accelerate your growth',
    duration_minutes: 60,
    price: 150,
    is_published: true,
  },
  courses: [],
  theme: {
    primary_color: '#6366f1',
    background_color: '#ffffff',
    text_color: '#1f2937',
    font_family: 'inter',
    dark_mode: false,
  },
  social_proof: {
    total_students: 1234,
    product_count: 5,
  },
};

// Map template DB slugs to component slugs
const SLUG_MAP: Record<string, TemplateSlug> = {
  'minimal-clean': 'minimal-clean',
  'bold-creator': 'bold-creator',
  'course-academy': 'course-academy',
  'dark-premium': 'dark-premium',
  'warm-approachable': 'warm-approachable',
  'corporate-pro': 'corporate-pro',
  'vibrant-social': 'vibrant-social',
  'editorial': 'editorial',
  'tech-vibe': 'tech-vibe',
  'luxury': 'luxury',
};

/**
 * Premium Template Selection Grid
 * Shows real template previews in phone mockups
 */
export function TemplateGrid({ templates, selectedTemplateId }: TemplateGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(selectedTemplateId);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const supabase = createClient();

  const handleSelect = (templateId: string) => {
    setSelected(templateId);
  };

  const handleContinue = async () => {
    if (!selected) return;

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ template_id: selected })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving template:', error);
        return;
      }

      router.push('/onboarding/setup-profile');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    minimal: 'Minimal',
    bold: 'Bold',
    elegant: 'Elegant',
    creative: 'Creative',
    professional: 'Professional',
  };

  return (
    <>
      {/* Template Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => {
          const templateSlug = SLUG_MAP[template.slug] || 'minimal-clean';
          
          return (
            <TemplateCard
              key={template.id}
              template={template}
              templateSlug={templateSlug}
              isSelected={selected === template.id}
              categoryLabel={categoryLabels[template.category] || template.category}
              onSelect={() => handleSelect(template.id)}
              onPreview={() => setPreviewTemplate(template)}
            />
          );
        })}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl safe-area-bottom">
        <div className="container-page flex items-center justify-between py-4">
          <p className="text-sm text-zinc-400">
            {selected ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Template selected
              </span>
            ) : (
              'Select a template to continue'
            )}
          </p>
          <Button
            onClick={handleContinue}
            disabled={!selected}
            isLoading={isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6"
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Bottom padding for sticky footer */}
      <div className="h-24" />

      {/* Full Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          templateSlug={SLUG_MAP[previewTemplate.slug] || 'minimal-clean'}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            handleSelect(previewTemplate.id);
            setPreviewTemplate(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Individual Template Card with Phone Mockup
 */
function TemplateCard({
  template,
  templateSlug,
  isSelected,
  categoryLabel,
  onSelect,
  onPreview,
}: {
  template: Template;
  templateSlug: TemplateSlug;
  isSelected: boolean;
  categoryLabel: string;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative cursor-pointer transition-all duration-300',
        'hover:-translate-y-2'
      )}
    >
      {/* Phone Mockup Frame */}
      <div
        className={cn(
          'relative overflow-hidden rounded-[2.5rem] border-[3px] bg-zinc-900 p-2 transition-all duration-300',
          isSelected
            ? 'border-indigo-500 shadow-[0_0_40px_-8px_rgba(99,102,241,0.5)]'
            : 'border-zinc-700 hover:border-zinc-600'
        )}
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-3 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-zinc-900" />
        
        {/* Screen Container */}
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] bg-white">
          {/* Scaled Template Preview */}
          <div className="absolute inset-0 origin-top scale-[0.33] overflow-hidden" style={{ width: '300%', height: '300%' }}>
            <TemplateRenderer
              templateSlug={templateSlug}
              data={PREVIEW_DATA}
              isPreview={true}
              showPoweredBy={false}
            />
          </div>
          
          {/* Gradient overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Selection Checkmark */}
        {isSelected && (
          <div className="absolute -right-2 -top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 shadow-lg ring-4 ring-zinc-950">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Preview Button - appears on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-zinc-900 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-white"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        {/* Premium Badge */}
        {template.is_premium && (
          <div className="absolute left-4 top-8 z-20">
            <Badge variant="pro" size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              PRO
            </Badge>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="mt-4 px-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{template.name}</h3>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            {categoryLabel}
          </span>
        </div>
        {template.description && (
          <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">
            {template.description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Full-screen Template Preview Modal
 */
function TemplatePreviewModal({
  template,
  templateSlug,
  onClose,
  onSelect,
}: {
  template: Template;
  templateSlug: TemplateSlug;
  onClose: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 backdrop-blur-sm transition-colors hover:bg-zinc-700 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="flex flex-col items-center gap-6 lg:flex-row lg:gap-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Phone Mockup Preview */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
            {/* Notch */}
            <div className="absolute left-1/2 top-4 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
            
            {/* Screen */}
            <div className="relative h-[600px] w-[280px] overflow-hidden rounded-[2.25rem] bg-white md:h-[700px] md:w-[340px]">
              {/* Scrollable Template */}
              <div className="h-full overflow-y-auto no-scrollbar">
                <div className="origin-top scale-[0.5]" style={{ width: '200%', transformOrigin: 'top left' }}>
                  <TemplateRenderer
                    templateSlug={templateSlug}
                    data={PREVIEW_DATA}
                    isPreview={true}
                    showPoweredBy={false}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Reflection effect */}
          <div className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-2xl" />
        </div>

        {/* Template Info Panel */}
        <div className="max-w-sm text-center lg:text-left">
          <h2 className="text-3xl font-bold text-white">{template.name}</h2>
          <p className="mt-3 text-lg text-zinc-400">{template.description}</p>
          
          {/* Features */}
          <ul className="mt-6 space-y-3">
            {[
              'Fully responsive design',
              'Optimized for conversions',
              'Easy to customize',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-zinc-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={onSelect}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8"
            >
              Select Template
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Back to Gallery
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

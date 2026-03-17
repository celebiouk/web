'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { CreatorPageData, TemplateSlug } from '@/types/creator-page';

// Import all template components
import { MinimalClean } from './MinimalClean';
import { BoldCreator } from './BoldCreator';
import { CourseAcademy } from './CourseAcademy';
import { DarkPremium } from './DarkPremium';
import { WarmApproachable } from './WarmApproachable';
import { CorporatePro } from './CorporatePro';
import { VibrantSocial } from './VibrantSocial';
import { Editorial } from './Editorial';
import { TechVibe } from './TechVibe';
import { Luxury } from './Luxury';
import { Phase7GrowthBlocks } from './phase7-growth-blocks';

export interface TemplateRendererProps {
  templateSlug: string;
  data: CreatorPageData;
  isPreview?: boolean;
  onSectionClick?: (section: 'hero' | 'products' | 'coaching' | 'courses' | 'testimonials') => void;
  showPoweredBy?: boolean;
}

// Map template slugs to components
const TEMPLATE_MAP: Record<TemplateSlug, React.ComponentType<TemplateProps>> = {
  'minimal-clean': MinimalClean,
  'bold-creator': BoldCreator,
  'course-academy': CourseAcademy,
  'dark-premium': DarkPremium,
  'warm-approachable': WarmApproachable,
  'corporate-pro': CorporatePro,
  'vibrant-social': VibrantSocial,
  'editorial': Editorial,
  'tech-vibe': TechVibe,
  'luxury': Luxury,
};

// Props that all template components receive
export interface TemplateProps {
  data: CreatorPageData;
  isPreview?: boolean;
  onSectionClick?: (section: 'hero' | 'products' | 'coaching' | 'courses' | 'testimonials') => void;
  showPoweredBy?: boolean;
}

/**
 * Dynamic Template Renderer
 * Renders the correct template component based on slug
 * Falls back to MinimalClean if slug not found
 */
export function TemplateRenderer({
  templateSlug,
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateRendererProps) {
  // Get the template component or fallback to minimal-clean
  const TemplateComponent = useMemo(() => {
    const slug = templateSlug as TemplateSlug;
    return TEMPLATE_MAP[slug] || TEMPLATE_MAP['minimal-clean'];
  }, [templateSlug]);

  const hasHeaderBanner = Boolean(data.profile.banner_url);
  const showAvatarOnBanner = data.profile.show_avatar_on_banner ?? true;

  // When a header banner exists, always strip the avatar from template data
  // so the template's own hero section never renders a duplicate avatar.
  // The avatar is shown exclusively on the banner overlay (when toggled ON).
  const dataForTemplate = useMemo(() => {
    if (!hasHeaderBanner) return data;
    return {
      ...data,
      profile: {
        ...data.profile,
        avatar_url: null,
      },
    };
  }, [data, hasHeaderBanner]);

  return (
    <>
      {hasHeaderBanner ? (
        <section className="relative w-full">
          {/* Banner image — overflow-hidden only here so avatar can hang below */}
          <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Image
              src={data.profile.banner_url as string}
              alt="Page header banner"
              fill
              priority={!isPreview}
              className="object-cover"
              sizes="100vw"
            />
          </div>

          {/* Avatar overlay — fully visible, centered at the bottom edge of the banner */}
          {showAvatarOnBanner && data.profile.avatar_url ? (
            <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-gray-950 dark:bg-gray-950">
                <Image
                  src={data.profile.avatar_url}
                  alt={`${data.profile.full_name} avatar`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Add top padding only when avatar overlaps so content doesn't hide behind it */}
      <div
        className={hasHeaderBanner && showAvatarOnBanner && data.profile.avatar_url ? 'pt-14' : ''}
        style={{
          backgroundColor: dataForTemplate.theme?.background_color || '#ffffff',
        }}
      >
        <TemplateComponent
          data={dataForTemplate}
          isPreview={isPreview}
          onSectionClick={onSectionClick}
          showPoweredBy={showPoweredBy}
        />
      </div>
      {!isPreview ? <Phase7GrowthBlocks data={data} /> : null}
    </>
  );
}

// Re-export types for convenience
export type { CreatorPageData, TemplateSlug };

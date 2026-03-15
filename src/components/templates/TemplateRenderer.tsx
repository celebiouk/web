'use client';

import { useMemo } from 'react';
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

  return (
    <>
      <TemplateComponent
        data={data}
        isPreview={isPreview}
        onSectionClick={onSectionClick}
        showPoweredBy={showPoweredBy}
      />
      {!isPreview ? <Phase7GrowthBlocks data={data} /> : null}
    </>
  );
}

// Re-export types for convenience
export type { CreatorPageData, TemplateSlug };

/**
 * Templates Export Index
 * All available template components for creator pages
 */

// Legacy component (kept for backwards compatibility)
export { CreatorPageShell } from './creator-page-shell';

// New template system
export { MinimalClean } from './MinimalClean';
export { BoldCreator } from './BoldCreator';
export { CourseAcademy } from './CourseAcademy';
export { DarkPremium } from './DarkPremium';
export { WarmApproachable } from './WarmApproachable';
export { CorporatePro } from './CorporatePro';
export { VibrantSocial } from './VibrantSocial';
export { Editorial } from './Editorial';
export { TechVibe } from './TechVibe';
export { Luxury } from './Luxury';

export { TemplateRenderer, type TemplateRendererProps, type TemplateProps } from './TemplateRenderer';

// Re-export shared utilities
export {
  formatPrice,
  getThemeStyles,
  getTestimonials,
  SectionWrapper,
  SocialLinks,
  PoweredByFooter,
  getProductPlaceholderImage,
} from './shared';

// Template metadata for picker UI
export const TEMPLATE_METADATA = [
  {
    slug: 'minimal-clean' as const,
    name: 'Minimal Clean',
    description: 'Clean white, elegant serif, lots of whitespace',
    category: 'minimal',
  },
  {
    slug: 'bold-creator' as const,
    name: 'Bold Creator',
    description: 'Big gradients, bold typography, high impact',
    category: 'bold',
  },
  {
    slug: 'course-academy' as const,
    name: 'Course Academy',
    description: 'Courses-first layout, progress indicators',
    category: 'education',
  },
  {
    slug: 'dark-premium' as const,
    name: 'Dark Premium',
    description: 'Dark theme, gold accents, cinematic feel',
    category: 'premium',
  },
  {
    slug: 'warm-approachable' as const,
    name: 'Warm Approachable',
    description: 'Soft colors, rounded corners, friendly feel',
    category: 'wellness',
  },
  {
    slug: 'corporate-pro' as const,
    name: 'Corporate Pro',
    description: 'Professional, structured, trust-building',
    category: 'business',
  },
  {
    slug: 'vibrant-social' as const,
    name: 'Vibrant Social',
    description: 'Colorful, Gen-Z aesthetic, high energy',
    category: 'social',
  },
  {
    slug: 'editorial' as const,
    name: 'Editorial',
    description: 'Magazine-style layout, strong typography',
    category: 'creative',
  },
  {
    slug: 'tech-vibe' as const,
    name: 'Tech Vibe',
    description: 'Dark mode, monospace accents, cyberpunk',
    category: 'tech',
  },
  {
    slug: 'luxury' as const,
    name: 'Luxury',
    description: 'Black & cream, high-ticket feel, exclusive',
    category: 'luxury',
  },
] as const;

export type TemplateCategory = 
  | 'minimal' 
  | 'bold' 
  | 'education' 
  | 'premium' 
  | 'wellness' 
  | 'business' 
  | 'social' 
  | 'creative' 
  | 'tech' 
  | 'luxury';

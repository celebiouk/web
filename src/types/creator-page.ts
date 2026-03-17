/**
 * Creator Page Data Types
 * Used by template renderer and all template components
 */

export type SocialLink = {
  platform: string;
  url: string;
};

export type PageTheme = {
  primary_color: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  dark_mode?: boolean;
};

export type CreatorProduct = {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string | null;
  description_html?: string | null;
  price: number;
  type: 'digital' | 'course' | 'coaching';
  cover_image_url: string | null;
  header_banner_url?: string | null;
  is_published: boolean;
  duration_minutes?: number | null;
};

export type CoachingSession = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_published: boolean;
};

export type CreatorCourse = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  cover_image_url: string | null;
  price_cents: number;
  lesson_count: number;
  student_count: number;
  creator_username: string;
};

export type CreatorBundle = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
  original_value_cents: number;
  products: Array<{
    id: string;
    title: string;
  }>;
};

export type CreatorPageData = {
  profile: {
    id: string;
    username: string;
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    show_avatar_on_banner?: boolean;
    page_background_type?: 'none' | 'color' | 'gradient' | 'image';
    page_background_value?: string | null;
    social_links: SocialLink[];
    subscription_tier: 'free' | 'pro';
    testimonials_enabled: boolean;
  };
  products: CreatorProduct[];
  coaching: CoachingSession | null;
  courses: CreatorCourse[];
  bundles?: CreatorBundle[];
  testimonials?: Testimonial[];
  email_form?: {
    title: string;
    description: string;
  };
  social_proof?: {
    total_students: number;
    product_count: number;
  };
  theme: PageTheme;
};

// Default theme for new creators
export const DEFAULT_THEME: PageTheme = {
  primary_color: '#6366f1',
  background_color: '#ffffff',
  text_color: '#1f2937',
  font_family: 'inter',
  dark_mode: false,
};

// Template slug type for type safety
export type TemplateSlug =
  | 'minimal-clean'
  | 'bold-creator'
  | 'course-academy'
  | 'dark-premium'
  | 'warm-approachable'
  | 'corporate-pro'
  | 'vibrant-social'
  | 'editorial'
  | 'tech-vibe'
  | 'luxury';

// Placeholder testimonials for templates
export type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  text: string;
};

export const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Entrepreneur',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    text: 'This completely transformed how I share my expertise. The quality is incredible.',
  },
  {
    name: 'Marcus Williams',
    role: 'Designer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    text: 'I\'ve tried everything out there. This is hands down the best investment I\'ve made.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Coach',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    text: 'My clients love the professionalism. It elevated my entire brand.',
  },
];

// Font family mappings for templates
export const FONT_FAMILIES = {
  // Legacy names
  'modern-sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'classic-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  'mono-tech': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
  // New font names
  'inter': '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  'playfair': '"Playfair Display", Georgia, serif',
  'source-sans': '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
  'cormorant': '"Cormorant Garamond", Georgia, serif',
  'plus-jakarta': '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
} as const;

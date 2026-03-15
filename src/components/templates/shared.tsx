/**
 * Shared utilities and components for all templates
 */

import Image from 'next/image';
import Link from 'next/link';
import { PLACEHOLDER_TESTIMONIALS, FONT_FAMILIES, type Testimonial, type PageTheme, type CreatorCourse, type CreatorPageData } from '@/types/creator-page';

// Format price from cents to display string
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Get CSS custom properties for theme
export function getThemeStyles(theme: PageTheme): React.CSSProperties {
  // Handle both old 'font' field and new 'font_family' field
  const fontKey = (theme as { font?: string }).font || theme.font_family || 'modern-sans';
  const fontFamily = FONT_FAMILIES[fontKey as keyof typeof FONT_FAMILIES] || FONT_FAMILIES['modern-sans'];
  
  return {
    '--primary': theme.primary_color,
    '--primary-light': `${theme.primary_color}20`,
    '--font-family': fontFamily,
    '--bg-color': theme.background_color || '#ffffff',
    '--text-color': theme.text_color || '#1f2937',
  } as React.CSSProperties;
}

// Social platform icons (inline SVG paths)
export const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  website: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
};

// Get testimonials for templates
export function getTestimonials(): Testimonial[] {
  return PLACEHOLDER_TESTIMONIALS;
}

// Generate concise conversion-proof bullets for hero sections
export function getSalesProofItems(data: CreatorPageData): string[] {
  const publishedProducts = data.products.filter((product) => product.is_published).length;
  const publishedCourses = data.courses.length;
  const hasCoaching = Boolean(data.coaching?.is_published);

  const items: string[] = [];

  if (publishedProducts > 0) {
    items.push(`${publishedProducts} digital offer${publishedProducts === 1 ? '' : 's'}`);
  }

  if (publishedCourses > 0) {
    items.push(`${publishedCourses} course${publishedCourses === 1 ? '' : 's'}`);
  }

  if (hasCoaching) {
    items.push('1:1 coaching available');
  }

  if (items.length === 0) {
    items.push('New premium offers dropping soon');
  }

  return items.slice(0, 3);
}

export function SalesProofBar({
  items,
  primaryColor,
  variant = 'light',
  className = '',
}: {
  items: string[];
  primaryColor: string;
  variant?: 'light' | 'dark';
  className?: string;
}) {
  if (!items.length) return null;

  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${
            isDark ? 'text-white/85' : 'text-gray-700'
          }`}
          style={{
            borderColor: `${primaryColor}55`,
            backgroundColor: isDark ? `${primaryColor}26` : `${primaryColor}14`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// Common animation classes
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  slideIn: 'animate-slide-in',
};

// Section wrapper with edit overlay for preview mode
export function SectionWrapper({
  id,
  children,
  isPreview,
  onEdit,
  className = '',
  style,
}: {
  id: string;
  children: React.ReactNode;
  isPreview?: boolean;
  onEdit?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section id={id} className={`group/section relative ${className}`} style={style}>
      {children}
      {isPreview && onEdit && (
        <button
          onClick={onEdit}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 hover:bg-black/15 hover:opacity-100 group-hover/section:opacity-100 cursor-pointer"
          aria-label={`Edit ${id} section`}
        >
          <span className="rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow-xl backdrop-blur transform scale-95 group-hover/section:scale-100 transition-transform">
            Edit {id.charAt(0).toUpperCase() + id.slice(1)}
          </span>
        </button>
      )}
    </section>
  );
}

// Social link component
export function SocialLinks({
  links,
  className = '',
  iconSize = 20,
  style,
}: {
  links: { platform: string; url: string }[];
  className?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}) {
  if (!links || links.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`} style={style}>
      {links.map((link, index) => {
        const iconPath = SOCIAL_ICONS[link.platform.toLowerCase()] || SOCIAL_ICONS.website;
        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/15 bg-white/10 transition-all hover:-translate-y-0.5 hover:scale-105 hover:bg-white/20"
            aria-label={`Visit ${link.platform}`}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="opacity-80 transition-opacity hover:opacity-100"
            >
              <path d={iconPath} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}

// Product card placeholder image based on product type
export function getProductPlaceholderImage(type: string): string {
  const placeholders: Record<string, string> = {
    digital: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop',
    course: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop',
    coaching: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
  };
  return placeholders[type] || placeholders.digital;
}

// Powered by cele.bio footer
export function PoweredByFooter({
  show = true,
  theme = 'light',
}: {
  show?: boolean;
  theme?: 'light' | 'dark';
}) {
  if (!show) return null;

  return (
    <div className={`py-6 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
      <a
        href="https://cele.bio"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Powered by <span className="font-medium">cele.bio</span>
      </a>
    </div>
  );
}

// Courses section shared across templates
export function CoursesSection({
  courses,
  username,
  primaryColor = '#6366f1',
  variant = 'light',
  className = '',
}: {
  courses: CreatorCourse[];
  username: string;
  primaryColor?: string;
  variant?: 'light' | 'dark';
  className?: string;
}) {
  if (!courses || courses.length === 0) return null;

  const isDark = variant === 'dark';

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${username}/${course.slug}`}
            className={`group overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${
              isDark
                ? 'border-white/10 bg-white/5 hover:border-white/20'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="aspect-[16/9] overflow-hidden bg-gray-100">
              {course.cover_image_url ? (
                <Image
                  src={course.cover_image_url}
                  alt={course.title}
                  width={600}
                  height={338}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primaryColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className={`font-semibold mb-1 line-clamp-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {course.title}
              </h3>
              {course.subtitle && (
                <p className={`text-sm mb-3 line-clamp-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {course.subtitle}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {course.price_cents === 0 ? 'Free' : formatPrice(course.price_cents)}
                </span>
                <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {course.lesson_count > 0 && (
                    <span>{course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''}</span>
                  )}
                  {course.student_count > 0 && (
                    <span>{course.student_count} student{course.student_count !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

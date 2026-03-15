'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { TemplateProps } from './TemplateRenderer';
import {
  formatPriceClean,
  getThemeStyles,
  getTestimonials,
  getSalesProofItems,
  SectionWrapper,
  SocialLinks,
  PoweredByFooter,
  ProductCardHorizontal,
  CoachingCard,
  TrustBadges,
  CoursesSection,
} from './shared';

/**
 * Minimal Clean Template - Premium Redesign
 * Clean, sophisticated, conversion-optimized
 * Outclasses Stan.store with better typography and UX
 */
export function MinimalClean({
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateProps) {
  const { profile, products, coaching, courses, theme } = data;
  const testimonials = getTestimonials();
  const digitalProducts = products.filter((p) => p.type !== 'coaching' && p.is_published);
  const primaryOffer = digitalProducts[0] || null;
  const themeStyles = getThemeStyles(theme);

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        ...themeStyles,
        fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Hero Section */}
      <SectionWrapper
        id="hero"
        isPreview={isPreview}
        onEdit={() => onSectionClick?.('hero')}
        className="relative overflow-hidden"
      >
        {/* Subtle gradient background */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ 
            background: `radial-gradient(ellipse at top, ${theme.primary_color} 0%, transparent 70%)` 
          }}
        />
        
        <div className="relative mx-auto max-w-lg px-6 pb-12 pt-16 text-center">
          {/* Avatar */}
          <div className="mb-6 inline-block">
            {profile.avatar_url ? (
              <div className="relative">
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={140}
                  height={140}
                  className="rounded-full object-cover ring-4 ring-white shadow-2xl"
                />
                {/* Status indicator */}
                <div 
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.primary_color }}
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ) : (
              <div
                className="flex h-[140px] w-[140px] items-center justify-center rounded-full text-4xl font-bold text-white shadow-2xl"
                style={{ backgroundColor: theme.primary_color }}
              >
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {profile.full_name || 'Your Name'}
          </h1>

          {/* Bio */}
          <p className="mx-auto mb-8 max-w-md text-lg leading-relaxed text-gray-500">
            {profile.bio || 'Add a bio to tell visitors about yourself'}
          </p>

          {/* Social Links */}
          <SocialLinks
            links={profile.social_links}
            className="mb-8 justify-center"
            variant="filled"
            iconSize={18}
          />

          {/* Primary CTA */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={
                primaryOffer
                  ? `/checkout/${primaryOffer.id}`
                  : coaching?.is_published
                    ? `/book/${profile.username}/${coaching.id}`
                    : '#products'
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-gray-900/10 transition-all hover:shadow-xl hover:shadow-gray-900/15 active:scale-[0.98] sm:w-auto"
              style={{ backgroundColor: theme.primary_color }}
            >
              {primaryOffer ? `Get ${primaryOffer.title}` : coaching?.is_published ? 'Book a Session' : 'View Offers'}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            {digitalProducts.length > 1 && (
              <a
                href="#products"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-base font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
              >
                See All Offers
              </a>
            )}
          </div>
        </div>
      </SectionWrapper>

      {/* Main Content */}
      <div className="mx-auto max-w-lg px-6 pb-16">
        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-12"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Products
              </h2>
              <span className="text-sm text-gray-400">{digitalProducts.length} available</span>
            </div>
            <div className="space-y-4">
              {digitalProducts.map((product) => (
                <ProductCardHorizontal
                  key={product.id}
                  product={product}
                  username={profile.username}
                  primaryColor={theme.primary_color}
                  variant="light"
                />
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Coaching Section */}
        {coaching && coaching.is_published && (
          <SectionWrapper
            id="coaching"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('coaching')}
            className="mb-12"
          >
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Work With Me
            </h2>
            <CoachingCard
              coaching={coaching}
              username={profile.username}
              primaryColor={theme.primary_color}
              variant="light"
            />
          </SectionWrapper>
        )}

        {/* Courses Section */}
        {courses && courses.length > 0 && (
          <SectionWrapper
            id="courses"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('courses')}
            className="mb-12"
          >
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Courses
            </h2>
            <CoursesSection
              courses={courses}
              username={profile.username}
              primaryColor={theme.primary_color}
              variant="light"
            />
          </SectionWrapper>
        )}

        {/* Testimonials Section - Only show if enabled */}
        {profile.testimonials_enabled && testimonials.length > 0 && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="mb-12"
          >
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
              What People Say
            </h2>
            <div className="space-y-4">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6"
                >
                  {/* Stars */}
                  <div className="mb-3 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mb-4 text-gray-600 leading-relaxed">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Trust Badges */}
        <TrustBadges variant="light" className="mb-8" />

        {/* Footer */}
        <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
      </div>
    </div>
  );
}

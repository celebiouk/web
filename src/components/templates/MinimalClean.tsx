'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { TemplateProps } from './TemplateRenderer';
import {
  formatPrice,
  getThemeStyles,
  getTestimonials,
  SectionWrapper,
  SocialLinks,
  PoweredByFooter,
  getProductPlaceholderImage,
  CoursesSection,
} from './shared';

/**
 * Minimal Clean Template
 * Clean white, lots of whitespace, serif font
 * Perfect for coaches, writers, and consultants
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
  const themeStyles = getThemeStyles(theme);

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        ...themeStyles,
        fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      }}
    >
      <div className="mx-auto max-w-md px-6 py-12 md:max-w-lg">
        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-16 text-center"
        >
          {/* Avatar */}
          <div className="mb-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={120}
                height={120}
                className="mx-auto rounded-full object-cover"
              />
            ) : (
              <div
                className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full text-3xl font-medium text-white"
                style={{ backgroundColor: theme.primary_color }}
              >
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="mb-3 text-3xl font-light tracking-tight text-gray-900">
            {profile.full_name || 'Your Name'}
          </h1>

          {/* Bio */}
          <p className="mb-6 text-lg leading-relaxed text-gray-600">
            {profile.bio || 'Add a bio to tell visitors about yourself'}
          </p>

          {/* Social Links */}
          <SocialLinks
            links={profile.social_links}
            className="mb-8 justify-center text-gray-400"
          />

          {/* CTA Button */}
          <button
            className="rounded-full px-8 py-3 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: theme.primary_color }}
          >
            Get Updates
          </button>
        </SectionWrapper>

        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-16"
          >
            <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
              Products
            </h2>
            <div className="space-y-6">
              {digitalProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:border-gray-200 hover:shadow-lg"
                >
                  <div className="aspect-[3/2] overflow-hidden bg-gray-50">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      {product.title}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-500">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="rounded-full px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ backgroundColor: theme.primary_color }}
                        >
                          Get Access
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
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
            className="mb-16"
          >
            <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
              Work With Me
            </h2>
            <div className="rounded-2xl border border-gray-100 p-8 text-center">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${theme.primary_color}15` }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: theme.primary_color }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-medium text-gray-900">
                {coaching.title}
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                {coaching.description}
              </p>
              <p className="mb-6 text-sm text-gray-400">
                {coaching.duration_minutes} minutes • {formatPrice(coaching.price)}
              </p>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="block w-full rounded-full px-6 py-3 text-center text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: theme.primary_color }}
              >
                Book a Call
              </Link>
            </div>
          </SectionWrapper>
        )}

        {/* Courses Section */}
        {courses && courses.length > 0 && (
          <SectionWrapper
            id="courses"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('courses')}
            className="mb-16"
          >
            <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
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

        {/* Testimonials Section */}
        <SectionWrapper
          id="testimonials"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('testimonials')}
          className="mb-16"
        >
          <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
            What People Say
          </h2>
          <div className="space-y-6">
            {testimonials.slice(0, 2).map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 p-6"
              >
                <p className="mb-4 text-sm leading-relaxed text-gray-600 italic">
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
                    <p className="text-sm font-medium text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionWrapper>

        {/* Footer */}
        <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
      </div>
    </div>
  );
}

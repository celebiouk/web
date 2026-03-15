'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { TemplateProps } from './TemplateRenderer';
import {
  formatPrice,
  getThemeStyles,
  getTestimonials,
  getSalesProofItems,
  SalesProofBar,
  SectionWrapper,
  SocialLinks,
  PoweredByFooter,
  getProductPlaceholderImage,
  CoursesSection,
} from './shared';

/**
 * Bold Creator Template
 * Big hero image, bold typography, high contrast
 * Perfect for influencers, artists, and content creators
 */
export function BoldCreator({
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateProps) {
  const { profile, products, coaching, courses, theme } = data;
  const testimonials = getTestimonials();
  const digitalProducts = products.filter((p) => p.type !== 'coaching' && p.is_published);
  const primaryOffer = digitalProducts[0] || null;
  const heroProofItems = getSalesProofItems(data);
  const themeStyles = getThemeStyles(theme);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        ...themeStyles,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Hero Section - Full Width */}
      <SectionWrapper
        id="hero"
        isPreview={isPreview}
        onEdit={() => onSectionClick?.('hero')}
        className="relative min-h-[60vh] flex items-end"
      >
        {/* Background Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.primary_color}dd 50%, ${theme.primary_color}99 100%)`,
          }}
        />

        {/* Decorative Elements */}
        <div
          className="absolute top-10 right-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: 'white' }}
        />
        <div
          className="absolute bottom-20 left-10 h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: 'white' }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-md px-6 pb-12 pt-24 text-white md:max-w-lg">
          {/* Avatar */}
          <div className="mb-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={100}
                height={100}
                className="rounded-2xl object-cover ring-4 ring-white/20"
              />
            ) : (
              <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
            {profile.full_name || 'Your Name'}
          </h1>

          {/* Bio */}
          <p className="mb-6 text-lg leading-relaxed text-white/80">
            {profile.bio || 'Add a bio to tell visitors about yourself'}
          </p>

          <SalesProofBar
            items={heroProofItems}
            primaryColor="#ffffff"
            variant="dark"
            className="mb-6 justify-start"
          />

          {/* Social Links */}
          <SocialLinks
            links={profile.social_links}
            className="mb-8 text-white/70"
            iconSize={22}
          />

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={
                primaryOffer
                  ? `/checkout/${primaryOffer.id}`
                  : coaching?.is_published
                    ? `/book/${profile.username}/${coaching.id}`
                    : '#products'
              }
              className="rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{ color: theme.primary_color }}
            >
              {primaryOffer ? 'Get It Now' : coaching?.is_published ? 'Book Now' : 'Explore Offers'}
            </Link>
            <a
              href="#products"
              className="rounded-full border border-white/40 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
            >
              See Everything
            </a>
          </div>
        </div>
      </SectionWrapper>

      <div className="mx-auto max-w-md px-6 py-12 md:max-w-lg">
        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-16"
          >
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight text-gray-900">
              My Products
            </h2>
            <div className="space-y-6">
              {digitalProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-3xl bg-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="aspect-[2/1] overflow-hidden">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      width={600}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                      {product.type === 'course' ? 'Course' : 'Digital'}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      {product.title}
                    </h3>
                    <p className="mb-4 text-sm text-gray-500">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black" style={{ color: theme.primary_color }}>
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: theme.primary_color }}
                        >
                          Get It Now
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
            <div
              className="rounded-3xl p-8 text-white"
              style={{ backgroundColor: theme.primary_color }}
            >
              <div className="mb-4 text-xs font-bold uppercase tracking-wider opacity-70">
                Limited Spots Available
              </div>
              <h3 className="mb-3 text-2xl font-black">
                {coaching.title}
              </h3>
              <p className="mb-4 text-white/80">
                {coaching.description}
              </p>
              <div className="mb-6 flex items-center gap-4 text-sm">
                <span className="rounded-full bg-white/20 px-3 py-1">
                  ⏱️ {coaching.duration_minutes} min
                </span>
                <span className="text-xl font-black">
                  {formatPrice(coaching.price)}
                </span>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="block w-full rounded-full bg-white py-4 text-center text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{ color: theme.primary_color }}
              >
                Book Your Spot
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
            <h2 className="mb-8 text-center text-2xl font-black uppercase tracking-tight text-gray-900">
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
          <h2 className="mb-8 text-2xl font-black uppercase tracking-tight text-gray-900">
            Real Results
          </h2>
          <div className="space-y-4">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white p-6 shadow-lg"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
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

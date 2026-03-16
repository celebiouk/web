'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Hand, Heart, Clock, Sparkles } from 'lucide-react';
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
 * Warm Approachable Template
 * Soft colors, rounded corners, friendly feel
 * Perfect for wellness coaches, therapists, and lifestyle brands
 */
export function WarmApproachable({
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateProps) {
  const { profile, products, coaching, courses, theme } = data;
  const testimonials = getTestimonials(data.testimonials);
  const digitalProducts = products.filter((p) => p.type !== 'coaching' && p.is_published);
  const primaryOffer = digitalProducts[0] || null;
  const heroProofItems = getSalesProofItems(data);
  const themeStyles = getThemeStyles(theme);

  // Warm color palette
  const warmBg = '#FEF7F0';
  const warmAccent = theme.primary_color || '#E07A5F';

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeStyles,
        backgroundColor: warmBg,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="mx-auto max-w-md px-6 py-12 md:max-w-lg">
        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-14 text-center"
        >
          {/* Wave decoration */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${warmAccent}20` }}>
              <Hand className="h-6 w-6" style={{ color: warmAccent }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Avatar */}
          {profile.avatar_url ? (
            <div className="mb-6">
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={110}
                height={110}
                className="mx-auto rounded-[2rem] object-cover shadow-lg"
              />
            </div>
          ) : null}

          {/* Name */}
          <h1 className="mb-3 text-2xl font-semibold text-stone-800">
            Hey, I&apos;m {profile.full_name || 'Your Name'}
          </h1>

          {/* Bio */}
          <p className="mb-6 leading-relaxed text-stone-600">
            {profile.bio || 'Add a bio to tell visitors about yourself'}
          </p>

          {/* Sales Proof Bar */}
          <SalesProofBar
            items={heroProofItems}
            primaryColor={warmAccent}
            className="mb-6"
          />

          {/* Social Links */}
          <SocialLinks
            links={profile.social_links}
            className="mb-8 justify-center text-stone-400"
          />

          {/* Dual CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={
                primaryOffer
                  ? `/checkout/${primaryOffer.id}`
                  : coaching?.is_published
                    ? `/book/${profile.username}/${coaching.id}`
                    : '#products'
              }
              className="rounded-2xl px-8 py-4 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: warmAccent }}
            >
              {primaryOffer ? 'Get Started' : coaching?.is_published ? 'Book a Session' : 'See What I Offer'}
            </Link>
            <a
              href="#products"
              className="rounded-2xl border-2 px-8 py-4 text-sm font-semibold transition-all hover:bg-stone-50"
              style={{ borderColor: warmAccent, color: warmAccent }}
            >
              Browse Resources
            </a>
          </div>
        </SectionWrapper>

        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-14"
          >
            <h2 className="mb-6 text-center text-lg font-semibold text-stone-700">
              Resources for You
            </h2>
            <div className="space-y-5">
              {digitalProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="aspect-[5/3] overflow-hidden">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      width={600}
                      height={360}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 font-semibold text-stone-800">
                      {product.title}
                    </h3>
                    <p className="mb-4 text-sm text-stone-500">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold"
                        style={{ color: warmAccent }}
                      >
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
                          style={{ backgroundColor: warmAccent }}
                        >
                          Get It
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
            className="mb-14"
          >
            <div
              className="rounded-3xl p-6"
              style={{ backgroundColor: `${warmAccent}15` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${warmAccent}20` }}>
                <Sparkles className="h-5 w-5" style={{ color: warmAccent }} strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-800">
                {coaching.title}
              </h3>
              <p className="mb-4 text-sm text-stone-600">
                {coaching.description}
              </p>
              <div className="mb-5 flex items-center gap-3 text-sm text-stone-500">
                <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.5} /> {coaching.duration_minutes} min
                </span>
                <span className="font-semibold text-stone-700">
                  {formatPrice(coaching.price)}
                </span>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="block w-full rounded-2xl py-3.5 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
                style={{ backgroundColor: warmAccent }}
              >
                Book Your Session
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
            <h2 className="mb-8 text-center text-2xl font-semibold text-gray-800">
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
        {profile.testimonials_enabled && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="mb-12"
          >
            <h2 className="mb-6 text-center text-lg font-semibold text-stone-700">
              Kind Words
            </h2>
            <div className="space-y-4">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <p className="mb-4 text-sm text-stone-600">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-800">{testimonial.name}</p>
                      <p className="text-xs text-stone-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Footer */}
        <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
      </div>
    </div>
  );
}

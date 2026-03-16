'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { TemplateProps } from './TemplateRenderer';
import {
  formatPrice,
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
 * Dark Premium Template
 * Dark background, gold/white accents, cinematic
 * Perfect for premium brands, luxury services, high-ticket offers
 */
export function DarkPremium({
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
  
  // Use gold accent for this template
  const accentColor = '#D4AF37';

  return (
    <div
      className="min-h-screen bg-zinc-950"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="mx-auto max-w-md px-6 py-16 md:max-w-lg">
        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-20 text-center"
        >
          {/* Decorative line */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <div className="h-px w-12" style={{ backgroundColor: accentColor }} />
            <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accentColor }}>
              Welcome
            </span>
            <div className="h-px w-12" style={{ backgroundColor: accentColor }} />
          </div>

          {/* Avatar */}
          {profile.avatar_url ? (
            <div className="mb-8">
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={140}
                height={140}
                className="mx-auto rounded-full object-cover ring-2 ring-zinc-800"
              />
            </div>
          ) : null}

          {/* Name */}
          <h1 className="mb-4 text-4xl font-light tracking-wide text-white">
            {profile.full_name || 'Your Name'}
          </h1>

          {/* Bio */}
          <p className="mb-8 text-lg leading-relaxed text-zinc-400">
            {profile.bio || 'Add a bio to tell visitors about yourself'}
          </p>

          {/* Sales Proof Bar */}
          <SalesProofBar
            items={heroProofItems}
            primaryColor={accentColor}
            variant="dark"
            className="mb-8"
          />

          {/* Social Links */}
          <SocialLinks
            links={profile.social_links}
            className="mb-10 justify-center text-zinc-500"
            iconSize={20}
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
              className="border px-10 py-4 text-xs font-medium uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-zinc-950"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              {primaryOffer ? 'Get Exclusive Access' : coaching?.is_published ? 'Book Private Session' : 'View Collection'}
            </Link>
            <a
              href="#products"
              className="border border-zinc-700 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-zinc-500 hover:text-white"
            >
              Explore
            </a>
          </div>
        </SectionWrapper>

        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-20"
          >
            <div className="mb-10 text-center">
              <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                Exclusive
              </span>
              <h2 className="mt-2 text-2xl font-light text-white">Premium Collection</h2>
            </div>

            <div className="space-y-6">
              {digitalProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden border border-zinc-800 transition-all hover:border-zinc-700"
                >
                  <div className="aspect-[2/1] overflow-hidden">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      width={600}
                      height={300}
                      className="h-full w-full object-cover opacity-80 grayscale transition-all duration-700 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-lg font-light tracking-wide text-white">
                      {product.title}
                    </h3>
                    <p className="mb-4 text-sm text-zinc-500">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-light" style={{ color: accentColor }}>
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="border px-6 py-2 text-xs font-medium uppercase tracking-wider text-white transition-all hover:bg-white hover:text-zinc-950"
                          style={{ borderColor: accentColor }}
                        >
                          Access Now
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
            className="mb-20"
          >
            <div className="border p-8 text-center" style={{ borderColor: accentColor }}>
              <div className="mb-6">
                <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                  Private
                </span>
              </div>
              <h3 className="mb-3 text-2xl font-light text-white">
                {coaching.title}
              </h3>
              <p className="mb-6 text-zinc-500">
                {coaching.description}
              </p>
              <div className="mb-8 flex items-center justify-center gap-6 text-sm text-zinc-400">
                <span>{coaching.duration_minutes} Minutes</span>
                <span className="h-4 w-px bg-zinc-700" />
                <span className="font-medium text-white">{formatPrice(coaching.price)}</span>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="block w-full border py-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-zinc-950"
                style={{ borderColor: accentColor }}
              >
                Request Consultation
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
            <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-500">
              Courses
            </h2>
            <CoursesSection
              courses={courses}
              username={profile.username}
              primaryColor={theme.primary_color}
              variant="dark"
            />
          </SectionWrapper>
        )}

        {/* Testimonials Section - Only show if enabled */}
        {profile.testimonials_enabled && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="mb-16"
          >
            <div className="mb-10 text-center">
              <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                Testimonials
              </span>
            </div>
            <div className="space-y-6">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <div
                  key={index}
                  className="border-l-2 pl-6"
                  style={{ borderColor: accentColor }}
                >
                  <p className="mb-4 text-lg italic text-zinc-300">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full grayscale"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{testimonial.name}</p>
                      <p className="text-xs text-zinc-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Footer */}
        <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} theme="dark" />
      </div>
    </div>
  );
}

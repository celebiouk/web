'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Diamond, Gem } from 'lucide-react';
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
 * Luxury Template
 * Black & cream, high-ticket feel, exclusive
 * Perfect for premium coaches, luxury brands, and executive services
 */
export function Luxury({
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateProps) {
  const { profile, products, coaching, courses, theme } = data;
  const testimonials = getTestimonials();
  const digitalProducts = products.filter((p) => p.type !== 'coaching' && p.is_published);
  const themeStyles = getThemeStyles(theme);

  // Luxury palette
  const luxuryGold = theme.primary_color || '#B8860B';
  const luxuryBlack = '#0A0A0A';
  const luxuryCream = '#FDFBF7';

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeStyles,
        backgroundColor: luxuryBlack,
        color: luxuryCream,
        fontFamily: '"Cormorant Garamond", Georgia, serif',
      }}
    >
      {/* Gold accent line at top */}
      <div className="h-1" style={{ backgroundColor: luxuryGold }} />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-16 text-center"
        >
          {/* Decorative element */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="h-px w-12" style={{ backgroundColor: luxuryGold }} />
            <Gem className="h-4 w-4" style={{ color: luxuryGold }} strokeWidth={1.5} />
            <div className="h-px w-12" style={{ backgroundColor: luxuryGold }} />
          </div>

          {/* Avatar */}
          {profile.avatar_url ? (
            <div className="mb-8">
              <div className="relative mx-auto w-fit">
                <div
                  className="absolute inset-0 rounded-full blur-lg opacity-20"
                  style={{ backgroundColor: luxuryGold }}
                />
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={140}
                  height={140}
                  className="relative rounded-full object-cover ring-2"
                  style={{ '--tw-ring-color': luxuryGold } as React.CSSProperties}
                />
              </div>
            </div>
          ) : null}

          {/* Name */}
          <h1 className="mb-4 text-4xl font-light tracking-wide md:text-5xl"
            style={{ color: luxuryCream }}
          >
            {profile.full_name || 'Your Name'}
          </h1>

          {/* Bio */}
          <p className="mx-auto mb-8 max-w-md text-lg leading-relaxed opacity-70">
            {profile.bio || 'Your exclusive bio goes here'}
          </p>

          {/* Social Links */}
          <SocialLinks
            links={profile.social_links}
            className="mb-10 justify-center gap-6"
            style={{ color: luxuryGold }}
          />

          {/* CTA Button */}
          <button
            className="border px-10 py-4 text-sm uppercase tracking-[0.2em] transition-all hover:bg-opacity-10"
            style={{ 
              borderColor: luxuryGold, 
              color: luxuryGold,
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            Inquire Within
          </button>
        </SectionWrapper>

        {/* Divider */}
        <div className="mb-16 flex items-center justify-center">
          <div className="h-px w-full opacity-20" style={{ backgroundColor: luxuryCream }} />
        </div>

        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-16"
          >
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] opacity-50"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                Exclusive Access
              </p>
              <h2 className="text-3xl font-light tracking-wide">The Collection</h2>
            </div>

            <div className="grid gap-8">
              {digitalProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-sm"
                  style={{ backgroundColor: `${luxuryCream}08` }}
                >
                  <div className="aspect-[21/9] overflow-hidden">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      width={800}
                      height={340}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-2xl font-light tracking-wide">
                        {product.title}
                      </h3>
                      <span className="text-xl" style={{ color: luxuryGold }}>
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <p className="mb-6 text-sm opacity-60"
                      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                    >
                      {product.description}
                    </p>
                    <Link href={`/checkout/${product.id}`}>
                      <button
                        className="w-full border py-3 text-xs uppercase tracking-[0.15em] transition-all hover:bg-white hover:bg-opacity-5"
                        style={{ 
                          borderColor: luxuryGold, 
                          color: luxuryGold,
                          fontFamily: '"Inter", system-ui, sans-serif',
                        }}
                      >
                        Acquire
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Coaching Section - VIP style */}
        {coaching && coaching.is_published && (
          <SectionWrapper
            id="coaching"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('coaching')}
            className="mb-16"
          >
            <div
              className="border px-8 py-10 text-center"
              style={{ borderColor: luxuryGold }}
            >
              <div className="mb-4 flex items-center justify-center gap-2">
                <Gem className="h-4 w-4" style={{ color: luxuryGold }} strokeWidth={1.5} />
                <span className="text-xs uppercase tracking-[0.2em] opacity-50"
                  style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                >
                  Private &amp; Exclusive
                </span>
                <Gem className="h-4 w-4" style={{ color: luxuryGold }} strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 text-3xl font-light tracking-wide">
                {coaching.title}
              </h3>
              <p className="mx-auto mb-6 max-w-md text-sm opacity-60"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                {coaching.description}
              </p>
              <div className="mb-8 flex items-center justify-center gap-6 text-sm"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                <span className="opacity-50">{coaching.duration_minutes} Minutes</span>
                <span style={{ color: luxuryGold }}>|</span>
                <span style={{ color: luxuryGold }} className="text-lg">
                  {formatPrice(coaching.price)}
                </span>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="inline-block px-12 py-4 text-xs uppercase tracking-[0.2em] transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: luxuryGold, 
                  color: luxuryBlack,
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              >
                Reserve Your Session
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
            <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-[0.3em] text-gray-400">
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

        {/* Testimonials - Only show if enabled */}
        {profile.testimonials_enabled && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="mb-16"
          >
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] opacity-50"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                Client Experiences
              </p>
              <h2 className="text-3xl font-light tracking-wide">Words of Distinction</h2>
            </div>

            <div className="space-y-8">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <blockquote
                  key={index}
                  className="text-center"
                >
                  <span style={{ color: luxuryGold }} className="mb-4 block text-4xl">&ldquo;</span>
                  <p className="mb-6 text-xl italic leading-relaxed opacity-80">
                    {testimonial.text}
                  </p>
                  <footer className="flex items-center justify-center gap-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full ring-1"
                      style={{ '--tw-ring-color': luxuryGold } as React.CSSProperties}
                    />
                    <div className="text-left">
                      <cite className="text-sm font-medium not-italic"
                        style={{ 
                          fontFamily: '"Inter", system-ui, sans-serif',
                          color: luxuryGold,
                        }}
                      >
                        {testimonial.name}
                      </cite>
                      <p className="text-xs opacity-50"
                        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                      >
                        {testimonial.role}
                      </p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Footer */}
        <footer className="text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8" style={{ backgroundColor: luxuryGold }} />
            <Gem className="h-3 w-3" style={{ color: luxuryGold }} strokeWidth={1.5} />
            <div className="h-px w-8" style={{ backgroundColor: luxuryGold }} />
          </div>
          <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
        </footer>
      </div>
    </div>
  );
}

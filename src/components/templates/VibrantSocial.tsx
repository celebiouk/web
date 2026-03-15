'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, UserPlus, MessageCircle, Phone, Rocket } from 'lucide-react';
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
 * Vibrant Social Template
 * Colorful, Gen-Z aesthetic, high energy
 * Perfect for influencers, content creators, and social media brands
 */
export function VibrantSocial({
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

  // Vibrant Gen-Z palette
  const vibrantPrimary = theme.primary_color || '#8B5CF6';
  const vibrantSecondary = '#EC4899';
  const vibrantAccent = '#06B6D4';

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeStyles,
        background: `linear-gradient(135deg, ${vibrantPrimary}15 0%, ${vibrantSecondary}15 50%, ${vibrantAccent}15 100%)`,
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="mx-auto max-w-md px-5 py-8">
        {/* Hero Section - Stacked card style */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-8"
        >
          <div
            className="relative rounded-3xl bg-white p-6 shadow-xl"
            style={{
              boxShadow: `0 20px 40px ${vibrantPrimary}30`,
            }}
          >
            {/* Decorative gradient blob */}
            <div
              className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-50 blur-xl"
              style={{
                background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary})`,
              }}
            />

            {/* Avatar with gradient border */}
            <div className="relative mx-auto mb-4 w-fit">
              <div
                className="rounded-full p-1"
                style={{
                  background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary}, ${vibrantAccent})`,
                }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    width={100}
                    height={100}
                    className="rounded-full bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white text-3xl font-bold"
                    style={{ color: vibrantPrimary }}
                  >
                    {profile.full_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-white bg-green-400" />
            </div>

            {/* Name with gradient */}
            <h1
              className="mb-1 text-center text-2xl font-extrabold"
              style={{
                background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              @{profile.full_name?.toLowerCase().replace(/\s/g, '') || 'yourname'}
            </h1>

            {/* Bio */}
            <p className="mb-5 text-center text-sm text-slate-600">
              {profile.bio || 'Your bio goes here'}
            </p>

            {/* Sales Proof Bar */}
            <SalesProofBar
              items={heroProofItems}
              primaryColor={vibrantPrimary}
              className="mb-5 justify-center"
            />

            {/* Social Links - Colorful */}
            <div className="mb-5 flex justify-center gap-2">
              {['instagram', 'tiktok', 'youtube', 'twitter'].map((platform, i) => {
                const colors = [vibrantPrimary, vibrantSecondary, vibrantAccent, vibrantPrimary];
                return (
                  <div
                    key={platform}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: colors[i] }}
                  >
                    <SocialLinks
                      links={[{ platform: platform as 'instagram', url: '#' }]}
                      className="text-white"
                    />
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Link
                href={
                  primaryOffer
                    ? `/checkout/${primaryOffer.id}`
                    : coaching?.is_published
                      ? `/book/${profile.username}/${coaching.id}`
                      : '#products'
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary})`,
                }}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                {primaryOffer ? 'Get My Picks' : 'Shop Now'}
              </Link>
              <a
                href="#products"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ borderColor: vibrantPrimary, color: vibrantPrimary }}
              >
                <UserPlus className="h-4 w-4" strokeWidth={2} />
                Follow Me
              </a>
            </div>
          </div>
        </SectionWrapper>

        {/* Products Section - Card stack */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-8"
          >
            <h2 className="mb-4 text-center text-lg font-bold text-slate-800">
              My Stuff
            </h2>
            <div className="space-y-4">
              {digitalProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-transform hover:scale-[1.02]"
                  style={{
                    boxShadow: `0 10px 30px ${[vibrantPrimary, vibrantSecondary, vibrantAccent][idx % 3]}25`,
                  }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div
                      className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary})`,
                      }}
                    >
                      {formatPrice(product.price)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 font-bold text-slate-800">
                      {product.title}
                    </h3>
                    <p className="mb-4 text-sm text-slate-500 line-clamp-2">
                      {product.description}
                    </p>
                    <Link href={`/checkout/${product.id}`}>
                      <button
                        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{
                          background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary})`,
                        }}
                      >
                        Get It Now
                      </button>
                    </Link>
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
            className="mb-8"
          >
            <div
              className="overflow-hidden rounded-2xl p-[3px]"
              style={{
                background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary}, ${vibrantAccent})`,
              }}
            >
              <div className="rounded-[13px] bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" style={{ color: vibrantSecondary }} strokeWidth={2} />
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: vibrantSecondary }}
                  >
                    1-on-1
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">
                  {coaching.title}
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  {coaching.description}
                </p>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="rounded-lg px-3 py-1 text-sm font-semibold"
                    style={{ backgroundColor: `${vibrantPrimary}20`, color: vibrantPrimary }}
                  >
                    {coaching.duration_minutes} min
                  </span>
                  <span className="text-lg font-bold"
                    style={{ color: vibrantPrimary }}
                  >
                    {formatPrice(coaching.price)}
                  </span>
                </div>
                <Link
                  href={`/book/${profile.username}/${coaching.id}`}
                  className="block w-full rounded-xl py-3 text-center text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${vibrantPrimary}, ${vibrantSecondary})`,
                  }}
                >
                  Book a Call
                </Link>
              </div>
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
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
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

        {/* Testimonials - Horizontal scroll - Only show if enabled */}
        {profile.testimonials_enabled && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="mb-8"
          >
            <h2 className="mb-4 text-center text-lg font-bold text-slate-800">
              Love from the Fam
            </h2>
            <div className="flex snap-x gap-4 overflow-x-auto pb-4">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-[280px] flex-shrink-0 snap-center rounded-2xl bg-white p-5 shadow-md"
                >
                  <p className="mb-4 text-sm text-slate-600">
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
                      <p className="text-sm font-bold text-slate-800">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
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

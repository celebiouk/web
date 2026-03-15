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
 * Corporate Pro Template
 * Professional, structured, trust-building
 * Perfect for consultants, B2B services, and professional coaches
 */
export function CorporatePro({
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

  // Professional color palette
  const corpBlue = theme.primary_color || '#1E40AF';
  const lightGray = '#F8FAFC';

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        ...themeStyles,
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Header Bar */}
        <div
          className="border-b px-6 py-4"
          style={{ borderColor: `${corpBlue}15` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              {profile.full_name || 'Your Name'}
            </span>
            <SocialLinks
              links={profile.social_links}
              className="gap-3 text-slate-400"
            />
          </div>
        </div>

        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="px-6 py-12"
        >
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:text-left">
            {/* Avatar */}
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={120}
                height={120}
                className="rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex h-[120px] w-[120px] items-center justify-center rounded-lg text-3xl font-semibold text-white"
                style={{ backgroundColor: corpBlue }}
              >
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-2 text-2xl font-bold text-slate-900">
                {profile.full_name || 'Your Name'}
              </h1>
              <p className="mb-4 text-slate-600">
                {profile.bio || 'Add a professional bio to introduce yourself'}
              </p>
              <SalesProofBar
                items={heroProofItems}
                primaryColor={corpBlue}
                className="mb-4 md:justify-start"
              />
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Link
                  href={
                    primaryOffer
                      ? `/checkout/${primaryOffer.id}`
                      : coaching?.is_published
                        ? `/book/${profile.username}/${coaching.id}`
                        : '#products'
                  }
                  className="rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: corpBlue }}
                >
                  {primaryOffer ? 'Get Started' : coaching?.is_published ? 'Schedule Consultation' : 'Explore Services'}
                </Link>
                <a
                  href="#products"
                  className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  View Services
                </a>
              </div>
            </div>
          </div>
        </SectionWrapper>

        {/* Services / Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="px-6 py-10"
            style={{ backgroundColor: lightGray }}
          >
            <h2 className="mb-1 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resources & Services
            </h2>
            <p className="mb-8 text-center text-lg font-semibold text-slate-800">
              Professional Tools for Your Success
            </p>

            <div className="grid gap-5">
              {digitalProducts.map((product) => (
                <div
                  key={product.id}
                  className="group flex overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="w-32 flex-shrink-0 overflow-hidden md:w-40">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      width={160}
                      height={120}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="mb-1 font-semibold text-slate-800">
                        {product.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold" style={{ color: corpBlue }}>
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="rounded-md px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
                          style={{ backgroundColor: corpBlue }}
                        >
                          Learn More
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
            className="px-6 py-10"
          >
            <div
              className="rounded-lg border-l-4 p-6"
              style={{ 
                borderColor: corpBlue,
                backgroundColor: `${corpBlue}05`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    1:1 Consulting
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-slate-800">
                    {coaching.title}
                  </h3>
                  <p className="mb-4 text-sm text-slate-600">
                    {coaching.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">
                      ⏱ {coaching.duration_minutes} minutes
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatPrice(coaching.price)}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="mt-5 block w-full rounded-md py-3 text-center text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: corpBlue }}
              >
                Book Consultation
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
            <h2 className="mb-8 text-center text-xl font-semibold text-gray-900">
              Professional Courses
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
            className="px-6 py-10"
            style={{ backgroundColor: lightGray }}
          >
            <h2 className="mb-1 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Client Testimonials
            </h2>
            <p className="mb-8 text-center text-lg font-semibold text-slate-800">
              Trusted by Professionals
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="h-4 w-4"
                        style={{ color: corpBlue }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mb-4 text-sm text-slate-600">
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
                      <p className="text-sm font-medium text-slate-800">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Footer */}
        <div className="px-6 py-6">
          <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
        </div>
      </div>
    </div>
  );
}

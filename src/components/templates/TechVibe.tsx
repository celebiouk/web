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
 * Tech Vibe Template
 * Dark mode, monospace accents, cyberpunk touches
 * Perfect for developers, SaaS founders, tech educators
 */
export function TechVibe({
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateProps) {
  const { profile, products, coaching, courses, theme } = data;
  const testimonials = getTestimonials();
  const digitalProducts = products.filter((p) => p.type !== 'coaching' && p.is_published);
  const themeStyles = getThemeStyles(theme);

  // Tech palette
  const techGreen = theme.primary_color || '#10B981';
  const techDark = '#0D1117';
  const techGray = '#21262D';

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeStyles,
        backgroundColor: techDark,
        color: '#E6EDF3',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="mx-auto max-w-2xl px-5 py-8">
        {/* Terminal-style Header */}
        <div className="mb-8 flex items-center gap-2 rounded-lg p-4" style={{ backgroundColor: techGray }}>
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-4 font-mono text-sm text-slate-400">
            ~ /{profile.full_name?.toLowerCase().replace(/\s/g, '-') || 'creator'}
          </span>
        </div>

        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-10"
        >
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar with glowing border */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-lg blur-md opacity-50"
                style={{ backgroundColor: techGreen }}
              />
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={100}
                  height={100}
                  className="relative rounded-lg object-cover"
                />
              ) : (
                <div
                  className="relative flex h-[100px] w-[100px] items-center justify-center rounded-lg text-3xl font-bold"
                  style={{ backgroundColor: techGray, color: techGreen }}
                >
                  {profile.full_name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-2 text-2xl font-bold">
                <span style={{ color: techGreen }}>const</span>{' '}
                creator = &quot;{profile.full_name || 'Your Name'}&quot;
              </h1>
              <p className="mb-4 text-slate-400">
                <span className="font-mono text-sm" style={{ color: techGreen }}>// </span>
                {profile.bio || 'Your bio goes here'}
              </p>

              <SocialLinks
                links={profile.social_links}
                className="mb-5 justify-center gap-4 text-slate-500 md:justify-start"
              />

              <button
                className="rounded-md px-6 py-2.5 font-mono text-sm font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: techGreen, color: techDark }}
              >
                npx connect
              </button>
            </div>
          </div>
        </SectionWrapper>

        {/* Products Section - Code block style */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-10"
          >
            <div className="mb-4 flex items-center gap-2">
              <span style={{ color: techGreen }} className="font-mono text-sm">
                &gt;
              </span>
              <h2 className="text-lg font-semibold">products.map()</h2>
            </div>

            <div className="space-y-4">
              {digitalProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-lg transition-all hover:ring-1"
                  style={{ backgroundColor: techGray, '--tw-ring-color': techGreen } as React.CSSProperties}
                >
                  <div className="flex">
                    <div className="w-24 flex-shrink-0 overflow-hidden md:w-32">
                      <Image
                        src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                        alt={product.title}
                        width={128}
                        height={96}
                        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">[{idx}]</span>
                          <h3 className="font-semibold">{product.title}</h3>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono font-semibold" style={{ color: techGreen }}>
                          {formatPrice(product.price)}
                        </span>
                        <Link href={`/checkout/${product.id}`}>
                          <button
                            className="rounded px-4 py-1.5 font-mono text-xs font-semibold transition-colors"
                            style={{ backgroundColor: techGreen, color: techDark }}
                          >
                            buy()
                          </button>
                        </Link>
                      </div>
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
            className="mb-10"
          >
            <div
              className="rounded-lg border p-6"
              style={{ borderColor: `${techGreen}40`, backgroundColor: `${techGreen}10` }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: techGreen }}
                >
                  <span className="font-mono text-lg" style={{ color: techDark }}>1:1</span>
                </div>
                <span className="rounded-full px-3 py-1 font-mono text-xs"
                  style={{ backgroundColor: techGray, color: techGreen }}
                >
                  ASYNC = false
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {coaching.title}
              </h3>
              <p className="mb-4 text-sm text-slate-400">
                {coaching.description}
              </p>
              <div className="mb-4 font-mono text-sm text-slate-300">
                <span className="text-slate-500">duration:</span> {coaching.duration_minutes}min{' '}
                <span className="text-slate-500">|</span>{' '}
                <span className="text-slate-500">price:</span>{' '}
                <span style={{ color: techGreen }}>{formatPrice(coaching.price)}</span>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="block w-full rounded-md py-3 text-center font-mono text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: techGreen, color: techDark }}
              >
                scheduleCall()
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
            <h2 className="mb-8 text-center text-sm font-mono font-medium uppercase tracking-widest text-gray-500">
              ./courses
            </h2>
            <CoursesSection
              courses={courses}
              username={profile.username}
              primaryColor={theme.primary_color}
              variant="dark"
            />
          </SectionWrapper>
        )}

        {/* Testimonials - Terminal output style - Only show if enabled */}
        {profile.testimonials_enabled && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="mb-10"
          >
            <div className="mb-4 flex items-center gap-2">
              <span style={{ color: techGreen }} className="font-mono text-sm">
                &gt;
              </span>
              <h2 className="text-lg font-semibold">reviews.forEach()</h2>
            </div>

            <div className="space-y-4">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: techGray }}
                >
                  <p className="mb-3 font-mono text-sm text-slate-300">
                    <span style={{ color: techGreen }}>$</span> echo &quot;{testimonial.text}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="font-mono text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Footer */}
        <footer className="text-center">
          <pre className="mb-4 text-xs text-slate-600">
            {`// Built with cele.bio`}
          </pre>
          <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
        </footer>
      </div>
    </div>
  );
}

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
 * Editorial Template
 * Magazine-style layout, strong typography, editorial feel
 * Perfect for writers, journalists, photographers, and creative directors
 */
export function Editorial({
  data,
  isPreview = false,
  onSectionClick,
  showPoweredBy = true,
}: TemplateProps) {
  const { profile, products, coaching, courses, theme } = data;
  const testimonials = getTestimonials();
  const digitalProducts = products.filter((p) => p.type !== 'coaching' && p.is_published);
  const themeStyles = getThemeStyles(theme);

  // Editorial palette
  const editorialBlack = '#0A0A0A';
  const editorialAccent = theme.primary_color || '#EF4444';

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        ...themeStyles,
        fontFamily: '"Playfair Display", Georgia, serif',
      }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Masthead */}
        <header className="border-b border-black/10 px-6 py-6">
          <div className="text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
            >
              The Works of
            </p>
            <h1 className="text-3xl font-bold italic tracking-tight md:text-4xl"
              style={{ color: editorialBlack }}
            >
              {profile.full_name || 'Your Name'}
            </h1>
          </div>
        </header>

        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="border-b border-black/10 px-6 py-10"
        >
          <div className={`grid gap-8 ${profile.avatar_url ? 'md:grid-cols-5' : ''}`}>
            {/* Avatar Column */}
            {profile.avatar_url ? (
              <div className="md:col-span-2">
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={300}
                  height={400}
                  className="aspect-[3/4] w-full object-cover grayscale transition-all hover:grayscale-0"
                />
              </div>
            ) : null}

            {/* Content Column */}
            <div className={profile.avatar_url ? 'md:col-span-3' : ''}>
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                About the Author
              </p>
              <p className="mb-6 text-lg leading-relaxed text-slate-700 md:text-xl">
                {profile.bio || 'Your bio sets the stage. Write something compelling.'}
              </p>
              <div
                className="mb-6 h-px w-16"
                style={{ backgroundColor: editorialAccent }}
              />
              <SocialLinks
                links={profile.social_links}
                className="gap-4 text-slate-400 hover:text-slate-800"
              />
            </div>
          </div>
        </SectionWrapper>

        {/* Featured Work Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="border-b border-black/10 px-6 py-10"
          >
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                Featured
              </p>
              <h2 className="text-2xl font-bold italic">The Collection</h2>
            </div>

            <div className="space-y-10">
              {digitalProducts.map((product, idx) => (
                <article
                  key={product.id}
                  className={`group grid gap-6 ${
                    idx % 2 === 0 ? 'md:grid-cols-2' : 'md:grid-cols-2 md:flex-row-reverse'
                  }`}
                >
                  <div className={idx % 2 === 0 ? '' : 'md:order-2'}>
                    <div className="aspect-[4/3] overflow-hidden">
                      <Image
                        src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                        alt={product.title}
                        width={600}
                        height={450}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  <div className={`flex flex-col justify-center ${idx % 2 === 0 ? '' : 'md:order-1'}`}>
                    <span className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-500"
                      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                    >
                      Issue {idx + 1}
                    </span>
                    <h3 className="mb-3 text-xl font-bold italic md:text-2xl">
                      {product.title}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600"
                      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                    >
                      {product.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold" style={{ color: editorialAccent }}>
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="border-b-2 text-sm font-medium transition-colors"
                          style={{ 
                            borderColor: editorialBlack, 
                            color: editorialBlack,
                            fontFamily: '"Inter", system-ui, sans-serif',
                          }}
                        >
                          Acquire →
                        </button>
                      </Link>
                    </div>
                  </div>
                </article>
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
            className="border-b border-black/10 px-6 py-10"
          >
            <div className="mx-auto max-w-lg text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                Private Sessions
              </p>
              <h3 className="mb-4 text-2xl font-bold italic">
                {coaching.title}
              </h3>
              <p className="mb-6 text-slate-600"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                {coaching.description}
              </p>
              <div className="mb-6 flex items-center justify-center gap-6 text-sm"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                <span className="text-slate-500">
                  {coaching.duration_minutes} minutes
                </span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="font-semibold" style={{ color: editorialAccent }}>
                  {formatPrice(coaching.price)}
                </span>
              </div>
              <Link
                href={`/book/${profile.username}/${coaching.id}`}
                className="inline-block border-2 px-8 py-3 text-sm font-medium uppercase tracking-wider transition-colors hover:bg-black hover:text-white"
                style={{ 
                  borderColor: editorialBlack, 
                  color: editorialBlack,
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              >
                Reserve
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
            <h2 className="mb-8 text-center font-serif text-2xl text-gray-900">
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

        {/* Testimonials / Press Section - Only show if enabled */}
        {profile.testimonials_enabled && (
          <SectionWrapper
            id="testimonials"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('testimonials')}
            className="border-b border-black/10 px-6 py-10"
          >
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              >
                What People Say
              </p>
              <h2 className="text-2xl font-bold italic">Praise &amp; Reviews</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {testimonials.slice(0, 2).map((testimonial, index) => (
                <blockquote key={index} className="border-l-2 pl-6" style={{ borderColor: editorialAccent }}>
                  <p className="mb-4 text-lg italic text-slate-700">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <footer className="flex items-center gap-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full grayscale"
                    />
                    <div style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
                      <cite className="text-sm font-semibold not-italic text-slate-800">
                        {testimonial.name}
                      </cite>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* Footer */}
        <footer className="px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            © {new Date().getFullYear()} {profile.full_name || 'Creator'}
          </p>
          <PoweredByFooter show={showPoweredBy && profile.subscription_tier !== 'pro'} />
        </footer>
      </div>
    </div>
  );
}

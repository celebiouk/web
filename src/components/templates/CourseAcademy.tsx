'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, Star, Play, Users, Clock, Award } from 'lucide-react';
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
 * Course Academy Template
 * Courses-first layout, progress feel, structured
 * Perfect for educators, coaches, and course creators
 */
export function CourseAcademy({
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
      className="min-h-screen bg-slate-50"
      style={{
        ...themeStyles,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="mx-auto max-w-md px-6 py-12 md:max-w-lg">
        {/* Hero Section */}
        <SectionWrapper
          id="hero"
          isPreview={isPreview}
          onEdit={() => onSectionClick?.('hero')}
          className="mb-12 rounded-3xl bg-white p-8 shadow-sm"
        >
          <div className="flex items-center gap-5 mb-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={80}
                height={80}
                className="rounded-2xl object-cover"
              />
            ) : (
              <div
                className="flex h-[80px] w-[80px] items-center justify-center rounded-2xl text-2xl font-semibold text-white"
                style={{ backgroundColor: theme.primary_color }}
              >
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.full_name || 'Your Name'}
              </h1>
              <p className="text-sm text-slate-500">
                @{profile.username || 'username'}
              </p>
            </div>
          </div>

          <p className="mb-6 text-slate-600 leading-relaxed">
            {profile.bio || 'Add a bio to tell visitors about yourself'}
          </p>

          <SocialLinks
            links={profile.social_links}
            className="mb-6 text-slate-400"
          />

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: theme.primary_color }}
            >
              Subscribe
            </button>
            <button className="rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
              Follow
            </button>
          </div>
        </SectionWrapper>

        {/* Featured Course Badge */}
        {digitalProducts.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ backgroundColor: `${theme.primary_color}20`, color: theme.primary_color }}>
              <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-semibold text-slate-700">Featured Courses</span>
          </div>
        )}

        {/* Products Section */}
        {digitalProducts.length > 0 && (
          <SectionWrapper
            id="products"
            isPreview={isPreview}
            onEdit={() => onSectionClick?.('products')}
            className="mb-12 space-y-4"
          >
            {digitalProducts.map((product, index) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div className="flex">
                  <div className="relative w-1/3 min-h-[140px]">
                    <Image
                      src={product.cover_image_url || getProductPlaceholderImage(product.type)}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    {/* Progress indicator */}
                    <div className="absolute bottom-2 left-2 right-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: theme.primary_color,
                          width: `${(index + 1) * 33}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {product.type === 'course' ? 'Course' : 'Resource'}
                        </span>
                      </div>
                      <h3 className="mb-1 font-semibold text-slate-900 line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold" style={{ color: theme.primary_color }}>
                        {formatPrice(product.price)}
                      </span>
                      <Link href={`/checkout/${product.id}`}>
                        <button
                          className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ backgroundColor: theme.primary_color }}
                        >
                          Enroll
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            <div className="rounded-2xl border-2 border-dashed p-6" style={{ borderColor: `${theme.primary_color}40` }}>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${theme.primary_color}15` }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: theme.primary_color }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.primary_color }}>
                    1:1 Mentorship
                  </span>
                  <h3 className="mb-1 text-lg font-bold text-slate-900">
                    {coaching.title}
                  </h3>
                  <p className="mb-4 text-sm text-slate-500">
                    {coaching.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-900">{coaching.duration_minutes} min</span> • {formatPrice(coaching.price)}
                    </div>
                    <Link
                      href={`/book/${profile.username}/${coaching.id}`}
                      className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: theme.primary_color }}
                    >
                      Schedule
                    </Link>
                  </div>
                </div>
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
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Courses
            </h2>
            <p className="mb-8 text-center text-sm text-gray-500">Structured learning to help you grow</p>
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
          className="mb-12"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold text-slate-700">Student Reviews</span>
          </div>
          <div className="space-y-3">
            {testimonials.slice(0, 2).map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                  <div className="ml-auto flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600">&ldquo;{testimonial.text}&rdquo;</p>
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

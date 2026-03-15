'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Clock,
  Users,
  Video,
  FileText,
  File,
  ChevronDown,
  ChevronRight,
  Check,
  Globe,
  Lock,
  ArrowLeft,
  BookOpen,
  Award,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface CourseData {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  promo_video_url: string | null;
  category: string;
  difficulty: string;
  price_cents: number;
  student_count: number;
}

interface SectionData {
  id: string;
  title: string;
  position: number;
}

interface LessonData {
  id: string;
  section_id: string;
  title: string;
  type: 'video' | 'text' | 'file';
  position: number;
  is_free_preview: boolean;
  video_duration_seconds: number | null;
  estimated_duration_minutes: number | null;
}

interface CreatorData {
  id: string;
  full_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
}

const LESSON_TYPE_ICONS: Record<string, React.ElementType> = {
  video: Video,
  text: FileText,
  file: File,
};

function formatDuration(seconds: number | null, minutes: number | null): string {
  if (seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  if (minutes) return `${minutes} min`;
  return '';
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getTotalDuration(lessons: LessonData[]): string {
  let totalMinutes = 0;
  for (const lesson of lessons) {
    if (lesson.video_duration_seconds) {
      totalMinutes += Math.ceil(lesson.video_duration_seconds / 60);
    } else if (lesson.estimated_duration_minutes) {
      totalMinutes += lesson.estimated_duration_minutes;
    }
  }
  if (totalMinutes === 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function CourseSalesClient({
  course,
  sections,
  lessons,
  creator,
}: {
  course: CourseData;
  sections: SectionData[];
  lessons: LessonData[];
  creator: CreatorData;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.id))
  );

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalDuration = getTotalDuration(lessons);
  const lessonCount = lessons.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          {/* Back link */}
          <Link
            href={`/${creator.username}`}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {creator.full_name}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Course Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize">
                  {course.category}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize">
                  {course.difficulty}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {course.title}
              </h1>

              {course.subtitle && (
                <p className="text-lg text-gray-300 mb-6">{course.subtitle}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8">
                {lessonCount > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                  </span>
                )}
                {totalDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {totalDuration} total
                  </span>
                )}
                {course.student_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.student_count} student{course.student_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Creator */}
              <div className="flex items-center gap-3 mb-8">
                {creator.avatar_url ? (
                  <Image
                    src={creator.avatar_url}
                    alt={creator.full_name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    {creator.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{creator.full_name}</p>
                  <p className="text-xs text-gray-400">Creator</p>
                </div>
              </div>

              {/* CTA - mobile */}
              <div className="lg:hidden mb-8">
                <Link href={`/courses/${creator.username}/${course.slug}/enroll`}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg py-4 rounded-xl">
                    {course.price_cents === 0 ? 'Enroll for Free' : `Enroll — ${formatPrice(course.price_cents)}`}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Cover / Promo Video + CTA */}
            <div className="sticky top-8">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-gray-800">
                {/* Cover Image or Promo Video */}
                {course.promo_video_url ? (
                  <div className="aspect-video bg-black">
                    <video
                      src={course.promo_video_url}
                      controls
                      poster={course.cover_image_url || undefined}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : course.cover_image_url ? (
                  <div className="aspect-video relative">
                    <Image
                      src={course.cover_image_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/50" />
                  </div>
                )}

                {/* CTA - desktop */}
                <div className="hidden lg:block p-6">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      {formatPrice(course.price_cents)}
                    </span>
                  </div>
                  <Link href={`/courses/${creator.username}/${course.slug}/enroll`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg py-4 rounded-xl">
                      {course.price_cents === 0 ? 'Enroll for Free' : 'Enroll Now'}
                    </Button>
                  </Link>

                  <div className="mt-4 space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Full lifetime access
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Access on mobile and desktop
                    </div>
                    {lessonCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}{totalDuration ? ` (${totalDuration})` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            {course.description && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
                <div
                  className="prose prose-gray max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              </div>
            )}

            {/* Curriculum */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Curriculum</h2>
              <div className="space-y-3">
                {sections
                  .sort((a, b) => a.position - b.position)
                  .map((section) => {
                    const sectionLessons = lessons
                      .filter(l => l.section_id === section.id)
                      .sort((a, b) => a.position - b.position);
                    const isExpanded = expandedSections.has(section.id);

                    return (
                      <div key={section.id} className="rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-900">{section.title}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {sectionLessons.length} lesson{sectionLessons.length !== 1 ? 's' : ''}
                          </span>
                        </button>

                        {isExpanded && sectionLessons.length > 0 && (
                          <div className="border-t border-gray-100">
                            {sectionLessons.map((lesson) => {
                              const LessonIcon = LESSON_TYPE_ICONS[lesson.type] || FileText;
                              const duration = formatDuration(
                                lesson.video_duration_seconds,
                                lesson.estimated_duration_minutes
                              );

                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                                >
                                  <LessonIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 flex-1">
                                    {lesson.title}
                                  </span>
                                  {lesson.is_free_preview && (
                                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                      Preview
                                    </span>
                                  )}
                                  {duration && (
                                    <span className="text-xs text-gray-400">{duration}</span>
                                  )}
                                  {!lesson.is_free_preview && (
                                    <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {sections.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Curriculum coming soon</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Mobile CTA Sticky */}
          <div className="hidden lg:block">
            {/* Placeholder for sidebar widgets */}
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(course.price_cents)}
            </span>
          </div>
          <Link href={`/courses/${creator.username}/${course.slug}/enroll`} className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              {course.price_cents === 0 ? 'Enroll Free' : 'Enroll Now'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <a href="https://cele.bio" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Powered by <span className="font-medium">cele.bio</span>
        </a>
      </div>
    </div>
  );
}

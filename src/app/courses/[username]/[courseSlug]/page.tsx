import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/constants';
import { CourseSalesClient } from './client';

interface CoursePageProps {
  params: Promise<{ username: string; courseSlug: string }>;
}

/**
 * Generate metadata for the course sales page (SEO)
 */
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { username, courseSlug } = await params;
  const supabase = await createClient();

  // Get creator profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('username', username.toLowerCase())
    .single();

  const profile = profileRaw as { id: string; full_name: string | null } | null;
  if (!profile) return { title: 'Course Not Found' };

  // Get course
  const { data: course } = await (supabase.from('courses') as any)
    .select('title, subtitle, description, cover_image_url')
    .eq('creator_id', profile.id)
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();

  if (!course) return { title: 'Course Not Found' };

  return {
    title: `${course.title} | ${profile.full_name}`,
    description: course.subtitle || course.description?.slice(0, 160) || `Learn from ${profile.full_name}`,
    openGraph: {
      title: course.title,
      description: course.subtitle || '',
      url: `${APP_URL}/courses/${username}/${courseSlug}`,
      images: course.cover_image_url ? [{ url: course.cover_image_url, width: 1200, height: 630 }] : undefined,
    },
  };
}

/**
 * Course Sales Page (Public)
 * Displays course info, curriculum preview, and enrollment CTA
 */
export default async function CourseSalesPage({ params }: CoursePageProps) {
  const { username, courseSlug } = await params;
  const supabase = await createClient();

  // Get creator profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, username, bio, avatar_url, stripe_account_id, subscription_tier')
    .eq('username', username.toLowerCase())
    .single();

  if (!profileData) notFound();

  const profile = profileData as {
    id: string;
    full_name: string | null;
    username: string | null;
    bio: string | null;
    avatar_url: string | null;
    stripe_account_id: string | null;
    subscription_tier: string;
  };

  // Get course
  const { data: courseData } = await (supabase.from('courses') as any)
    .select('*')
    .eq('creator_id', profile.id)
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();

  if (!courseData) notFound();

  // Get sections + lessons
  const { data: sections } = await (supabase.from('course_sections') as any)
    .select('*')
    .eq('course_id', courseData.id)
    .order('position', { ascending: true });

  const { data: lessons } = await (supabase.from('course_lessons') as any)
    .select('id, section_id, title, type, position, is_free_preview, video_duration_seconds, estimated_duration_minutes')
    .eq('course_id', courseData.id)
    .order('position', { ascending: true });

  return (
    <CourseSalesClient
      course={courseData}
      sections={sections || []}
      lessons={lessons || []}
      creator={{
        id: profile.id,
        full_name: profile.full_name || 'Creator',
        username: profile.username || username,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        stripe_account_id: profile.stripe_account_id,
      }}
    />
  );
}

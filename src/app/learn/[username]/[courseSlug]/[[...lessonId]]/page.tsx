import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CoursePlayerClient } from './client';

interface PlayerPageProps {
  params: Promise<{ username: string; courseSlug: string; lessonId?: string }>;
}

export default async function CoursePlayerPage({ params }: PlayerPageProps) {
  const { username, courseSlug, lessonId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/courses/${username}/${courseSlug}`);
  }

  // Get creator profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('username', username.toLowerCase())
    .single();

  const profile = profileRaw as { id: string; full_name: string | null; username: string | null } | null;
  if (!profile) notFound();

  // Get course
  const { data: course } = await (supabase.from('courses') as any)
    .select('*')
    .eq('creator_id', profile.id)
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();

  if (!course) notFound();

  // Check enrollment
  const { data: enrollment } = await (supabase.from('enrollments') as any)
    .select('*')
    .eq('course_id', course.id)
    .eq('student_user_id', user.id)
    .single();

  if (!enrollment) {
    redirect(`/courses/${username}/${courseSlug}`);
  }

  // Get sections + lessons
  const { data: sections } = await (supabase.from('course_sections') as any)
    .select('*')
    .eq('course_id', course.id)
    .order('position', { ascending: true });

  const { data: lessons } = await (supabase.from('course_lessons') as any)
    .select('*')
    .eq('course_id', course.id)
    .order('position', { ascending: true });

  // Get progress
  const { data: progress } = await (supabase.from('lesson_progress') as any)
    .select('*')
    .eq('enrollment_id', enrollment.id);

  // If no lessonId, redirect to first lesson
  const allLessons = (lessons || []).sort((a: { position: number }, b: { position: number }) => a.position - b.position);
  if (!lessonId && allLessons.length > 0) {
    redirect(`/learn/${username}/${courseSlug}/${allLessons[0].id}`);
  }

  const currentLesson = lessonId
    ? allLessons.find((l: { id: string }) => l.id === lessonId)
    : allLessons[0];

  if (!currentLesson) notFound();

  return (
    <CoursePlayerClient
      course={course}
      sections={sections || []}
      lessons={allLessons}
      currentLesson={currentLesson}
      progress={progress || []}
      enrollment={enrollment}
      creator={{
        username: profile.username || username,
        full_name: profile.full_name || 'Creator',
      }}
    />
  );
}

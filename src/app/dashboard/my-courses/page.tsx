'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, Badge } from '@/components/ui';
import { LoadingScreen } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  ChevronRight,
  GraduationCap,
  Trophy,
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    cover_image_url: string | null;
    creator_id: string;
  };
  creator_username: string;
  creator_name: string;
  total_lessons: number;
  completed_lessons: number;
}

export default function MyCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEnrollments() {
      if (!user) return;

      try {
        // Get all enrollments
        const { data: enrollments, error: enrollError } = await (supabase.from('enrollments') as any)
          .select('id, course_id, enrolled_at')
          .eq('student_user_id', user.id)
          .order('enrolled_at', { ascending: false });

        if (enrollError || !enrollments || enrollments.length === 0) {
          setCourses([]);
          setIsLoading(false);
          return;
        }

        // For each enrollment, get course details + progress
        const enriched: EnrolledCourse[] = [];

        for (const enrollment of enrollments) {
          // Get course
          const { data: course } = await (supabase.from('courses') as any)
            .select('id, title, slug, subtitle, cover_image_url, creator_id')
            .eq('id', enrollment.course_id)
            .single();

          if (!course) continue;

          // Get creator
          const { data: creator } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', course.creator_id)
            .single();

          // Get total lessons
          const { count: totalLessons } = await (supabase.from('course_lessons') as any)
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get completed lessons
          const { count: completedLessons } = await (supabase.from('lesson_progress') as any)
            .select('id', { count: 'exact', head: true })
            .eq('enrollment_id', enrollment.id)
            .eq('is_completed', true);

          enriched.push({
            id: enrollment.id,
            course_id: enrollment.course_id,
            enrolled_at: enrollment.enrolled_at,
            course: course,
            creator_username: (creator as unknown as { username: string | null })?.username || '',
            creator_name: (creator as unknown as { full_name: string | null })?.full_name || 'Creator',
            total_lessons: totalLessons || 0,
            completed_lessons: completedLessons || 0,
          });
        }

        setCourses(enriched);
      } catch (err) {
        console.error('Error loading enrollments:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadEnrollments();
    }
  }, [user, authLoading, supabase]);

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your courses</h2>
            <p className="text-gray-500 mb-6">Access your enrolled courses and track your progress.</p>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-500 mt-1">Track your learning progress</p>
      </div>

      {/* Stats Summary */}
      {courses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-xs text-gray-500">Enrolled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Play className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.completed_lessons > 0 && c.completed_lessons < c.total_lessons).length}
              </p>
              <p className="text-xs text-gray-500">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.total_lessons > 0 && c.completed_lessons === c.total_lessons).length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((acc, c) => acc + c.completed_lessons, 0)}
              </p>
              <p className="text-xs text-gray-500">Lessons Done</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => {
            const progress = item.total_lessons > 0
              ? Math.round((item.completed_lessons / item.total_lessons) * 100)
              : 0;
            const isComplete = item.total_lessons > 0 && item.completed_lessons === item.total_lessons;
            const isStarted = item.completed_lessons > 0;

            return (
              <Link
                key={item.id}
                href={`/learn/${item.creator_username}/${item.course.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Cover */}
                  <div className="aspect-video relative bg-gray-100 overflow-hidden">
                    {item.course.cover_image_url ? (
                      <Image
                        src={item.course.cover_image_url}
                        alt={item.course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <GraduationCap className="w-10 h-10 text-white/50" />
                      </div>
                    )}
                    {isComplete && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="success" className="bg-green-500 text-white text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Complete
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">by {item.creator_name}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {item.course.title}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{item.completed_lessons}/{item.total_lessons} lessons</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        {isComplete ? 'Review' : isStarted ? 'Continue' : 'Start'}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-6">
              Explore courses from creators and start learning today.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

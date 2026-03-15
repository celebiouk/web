'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Badge } from '@/components/ui';
import { LoadingScreen } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  BookOpen,
  CheckCircle,
  Calendar,
} from 'lucide-react';

interface AnalyticsData {
  courseTitle: string;
  courseSlug: string;
  status: string;
  totalStudents: number;
  totalRevenue: number;
  avgCompletion: number;
  totalLessons: number;
  enrollments: {
    id: string;
    student_email: string;
    enrolled_at: string;
    amount_cents: number;
    completed_lessons: number;
    total_lessons: number;
  }[];
  lessonDropoff: {
    lesson_title: string;
    completions: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    count: number;
  }[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CourseAnalyticsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) return;

      try {
        // Get course
        const { data: course, error: courseError } = await (supabase.from('courses') as any)
          .select('*')
          .eq('id', courseId)
          .eq('creator_id', user.id)
          .single();

        if (courseError || !course) {
          setIsLoading(false);
          return;
        }

        // Get enrollments
        const { data: enrollments } = await (supabase.from('enrollments') as any)
          .select('*')
          .eq('course_id', courseId)
          .order('enrolled_at', { ascending: false });

        const allEnrollments = enrollments || [];

        // Get lessons
        const { data: lessons } = await (supabase.from('course_lessons') as any)
          .select('id, title, position')
          .eq('course_id', courseId)
          .order('position', { ascending: true });

        const totalLessons = lessons?.length || 0;

        // Get all progress
        const enrollmentIds = allEnrollments.map((e: { id: string }) => e.id);
        let allProgress: { enrollment_id: string; lesson_id: string; is_completed: boolean }[] = [];
        if (enrollmentIds.length > 0) {
          const { data: progressData } = await (supabase.from('lesson_progress') as any)
            .select('enrollment_id, lesson_id, is_completed')
            .in('enrollment_id', enrollmentIds);
          allProgress = progressData || [];
        }

        // Calculate per-enrollment completed lessons
        const enrichedEnrollments = allEnrollments.map((enrollment: { id: string; student_email: string; enrolled_at: string; amount_cents: number }) => {
          const enrollmentProgress = allProgress.filter(p => p.enrollment_id === enrollment.id && p.is_completed);
          return {
            ...enrollment,
            completed_lessons: enrollmentProgress.length,
            total_lessons: totalLessons,
          };
        });

        // Average completion percentage
        let avgCompletion = 0;
        if (allEnrollments.length > 0 && totalLessons > 0) {
          const totalCompletionPercent = enrichedEnrollments.reduce((acc: number, e: { completed_lessons: number }) => {
            return acc + (e.completed_lessons / totalLessons) * 100;
          }, 0);
          avgCompletion = Math.round(totalCompletionPercent / allEnrollments.length);
        }

        // Lesson drop-off (completions per lesson)
        const lessonDropoff = (lessons || []).map((lesson: { id: string; title: string }) => {
          const completions = allProgress.filter(p => p.lesson_id === lesson.id && p.is_completed).length;
          return {
            lesson_title: lesson.title,
            completions,
          };
        });

        // Revenue by month
        const monthMap = new Map<string, { revenue: number; count: number }>();
        allEnrollments.forEach((e: { enrolled_at: string; amount_cents: number }) => {
          const date = new Date(e.enrolled_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const existing = monthMap.get(key) || { revenue: 0, count: 0 };
          monthMap.set(key, {
            revenue: existing.revenue + (e.amount_cents || 0),
            count: existing.count + 1,
          });
        });

        const revenueByMonth = Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, { revenue, count }]) => ({ month, revenue, count }));

        // Total revenue
        const totalRevenue = allEnrollments.reduce((acc: number, e: { amount_cents: number }) => acc + (e.amount_cents || 0), 0);

        setData({
          courseTitle: course.title,
          courseSlug: course.slug,
          status: course.status,
          totalStudents: allEnrollments.length,
          totalRevenue,
          avgCompletion,
          totalLessons,
          enrollments: enrichedEnrollments,
          lessonDropoff,
          revenueByMonth,
        });
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadAnalytics();
    }
  }, [user, authLoading, courseId, supabase]);

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Course not found or you don&apos;t have access.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{data.courseTitle}</h1>
          <Badge variant={data.status === 'published' ? 'success' : 'default'}>
            {data.status}
          </Badge>
        </div>
        <p className="text-gray-500 mt-1">Course Analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalStudents}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(data.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.avgCompletion}%</p>
                <p className="text-xs text-gray-500">Avg Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalLessons}</p>
                <p className="text-xs text-gray-500">Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lesson Completion Drop-off */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              Lesson Completions
            </h3>
            {data.lessonDropoff.length > 0 ? (
              <div className="space-y-3">
                {data.lessonDropoff.map((lesson, i) => {
                  const maxCompletions = Math.max(...data.lessonDropoff.map(l => l.completions), 1);
                  const width = (lesson.completions / maxCompletions) * 100;

                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate max-w-[70%]">
                          {i + 1}. {lesson.lesson_title}
                        </span>
                        <span className="text-gray-500">{lesson.completions}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No lessons yet</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              Revenue Over Time
            </h3>
            {data.revenueByMonth.length > 0 ? (
              <div className="space-y-3">
                {data.revenueByMonth.map((item, i) => {
                  const maxRevenue = Math.max(...data.revenueByMonth.map(r => r.revenue), 1);
                  const width = (item.revenue / maxRevenue) * 100;

                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.month}</span>
                        <span className="text-gray-500">
                          {formatPrice(item.revenue)} ({item.count} sales)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No revenue data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="mt-8">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            Students ({data.totalStudents})
          </h3>
          {data.enrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Enrolled</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.enrollments.slice(0, 50).map((enrollment) => {
                    const progress = enrollment.total_lessons > 0
                      ? Math.round((enrollment.completed_lessons / enrollment.total_lessons) * 100)
                      : 0;
                    const isComplete = enrollment.total_lessons > 0 && enrollment.completed_lessons === enrollment.total_lessons;

                    return (
                      <tr key={enrollment.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-3 text-gray-900">{enrollment.student_email}</td>
                        <td className="py-2 px-3 text-gray-500">
                          {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-gray-700">{formatPrice(enrollment.amount_cents)}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isComplete ? 'bg-green-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-gray-500 text-xs">{progress}%</span>
                            {isComplete && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.enrollments.length > 50 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Showing first 50 students of {data.enrollments.length} total
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No students enrolled yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

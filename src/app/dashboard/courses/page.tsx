'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Button, UpgradePrompt } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  GraduationCap,
  Users,
  DollarSign,
  Eye,
} from 'lucide-react';

interface CourseWithStats {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  price_cents: number;
  student_count: number;
  created_at: string;
  category: string;
  difficulty: string;
  creator_id: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const { allowed: canAccessCourses } = useFeatureGate('courses');
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessCourses) {
      setLoading(false);
      return;
    }
    loadCourses();
  }, [canAccessCourses]);

  async function loadCourses() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase
      .from('courses') as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setCourses(data as CourseWithStats[]);
    }
    setLoading(false);
  }

  async function handleDelete(courseId: string) {
    if (!confirm('Are you sure? This will permanently delete this course and all its content.')) return;
    setDeleting(courseId);

    const supabase = createClient();
    await (supabase.from('courses') as any).delete().eq('id', courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setDeleting(null);
    setActiveMenu(null);
  }

  async function handleDuplicate(course: CourseWithStats) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newCourse } = await (supabase.from('courses') as any)
      .insert({
        creator_id: user.id,
        title: `${course.title} (Copy)`,
        slug: `${course.slug}-copy-${Date.now()}`,
        subtitle: course.subtitle,
        cover_image_url: course.cover_image_url,
        price_cents: course.price_cents,
        category: course.category,
        difficulty: course.difficulty,
        status: 'draft',
      })
      .select()
      .single();

    if (newCourse) {
      setCourses(prev => [newCourse as CourseWithStats, ...prev]);
    }
    setActiveMenu(null);
  }

  function formatPrice(cents: number): string {
    if (cents === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  // Pro gate
  if (!canAccessCourses) {
    return (
      <div className="animate-fade-in">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
            <Badge variant="pro">PRO</Badge>
          </div>
          <UpgradePrompt feature="courses" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <Badge variant="pro">PRO</Badge>
          {courses.length > 0 && (
            <span className="text-sm text-gray-500">({courses.length})</span>
          )}
        </div>
        <Link href="/dashboard/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 dark:bg-brand-500/10">
              <GraduationCap className="h-10 w-10 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Create your first course
            </h2>
            <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
              Build engaging video courses with modules, lessons, and progress tracking.
              Your students will love the learning experience.
            </p>
            <Link href="/dashboard/courses/new">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Course Cards Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
              {/* Cover Image */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                {course.cover_image_url ? (
                  <Image
                    src={course.cover_image_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    course.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                {/* Actions Menu */}
                <div className="absolute right-3 top-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === course.id ? null : course.id);
                    }}
                    className="rounded-full bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  {activeMenu === course.id && (
                    <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <Link
                        href={`/dashboard/courses/${course.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" /> Edit Course
                      </Link>
                      <Link
                        href={`/dashboard/courses/${course.id}/analytics`}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <BarChart3 className="h-4 w-4" /> Analytics
                      </Link>
                      {course.status === 'published' && (
                        <Link
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4" /> View Sales Page
                        </Link>
                      )}
                      <button
                        onClick={() => handleDuplicate(course)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-4 w-4" /> Duplicate
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deleting === course.id}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting === course.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <Link href={`/dashboard/courses/${course.id}/edit`}>
                  <h3 className="mb-1 font-semibold text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                    {course.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course.student_count} students
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatPrice(course.price_cents)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}

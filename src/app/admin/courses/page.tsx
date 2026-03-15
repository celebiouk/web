import { createClient } from '@/lib/supabase/server';
import { GraduationCap, Users, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';

type CourseWithProfile = {
  id: string;
  title: string;
  slug: string;
  price: number;
  is_published: boolean;
  profiles: { full_name: string | null; username: string | null } | null;
  enrollments: { count: number }[] | null;
};

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses, count } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!courses_creator_id_fkey(full_name, username),
      enrollments(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50) as unknown as { data: CourseWithProfile[] | null; count: number | null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Course Management
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {count?.toLocaleString()} total courses
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Enrollments</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {courses?.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/10">
                      <GraduationCap className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                      <p className="text-sm text-gray-500">{course.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  @{course.profiles?.username || 'unknown'}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  ${(course.price / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Users className="h-4 w-4" />
                    {course.enrollments?.[0]?.count || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {course.is_published ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                      <XCircle className="h-4 w-4" />
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { Flag, AlertTriangle, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';

type ProductWithProfile = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  profiles: { full_name: string | null; username: string | null } | null;
};

export default async function AdminModerationPage() {
  const supabase = await createClient();

  // Get reported content (placeholder - would need a reports table)
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      profiles!products_creator_id_fkey(full_name, username)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20) as unknown as { data: ProductWithProfile[] | null };

  const pendingReviews = 12;
  const approvedToday = 45;
  const rejectedToday = 3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Content Moderation
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Review and moderate user-generated content
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-white">
            <Flag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{pendingReviews}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-400">Approved Today</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">{approvedToday}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-red-700 dark:text-red-400">Rejected Today</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">{rejectedToday}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-4">
          {['All Content', 'Reported', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button
              key={tab}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                tab === 'All Content'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            {/* Product Image */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <div className="absolute right-2 top-2">
                <span className="rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                  Published
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {product.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                by @{product.profiles?.username || 'unknown'}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                {product.description || 'No description'}
              </p>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button className="flex items-center justify-center rounded-lg bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20">
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button className="flex items-center justify-center rounded-lg bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Recent Reports
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Report #{i} - Product Title
                  </p>
                  <span className="text-sm text-gray-500">2h ago</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Reason: Inappropriate content
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MessageSquare className="h-4 w-4" />
                  &quot;This product contains misleading information...&quot;
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600">
                    Take Action
                  </button>
                  <button className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

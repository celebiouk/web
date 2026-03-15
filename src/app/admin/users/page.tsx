import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { UsersTable } from '../../../components/admin/users/UsersTable';
import { UsersFilters } from '../../../components/admin/users/UsersFilters';
import { Spinner } from '@/components/ui';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const status = typeof params.status === 'string' ? params.status : 'all';
  const tier = typeof params.tier === 'string' ? params.tier : 'all';
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const perPage = 20;

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('profiles')
    .select('*, subscriptions(*)', { count: 'exact' });

  // Apply search filter
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Apply status filter
  if (status === 'suspended') {
    query = query.eq('is_suspended', true);
  } else if (status === 'active') {
    query = query.eq('is_suspended', false);
  }

  // Apply tier filter
  if (tier === 'pro') {
    query = query.eq('subscription_tier', 'pro');
  } else if (tier === 'free') {
    query = query.or('subscription_tier.is.null,subscription_tier.eq.free');
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data: users, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {count?.toLocaleString()} total users
          </p>
        </div>
      </div>

      {/* Filters */}
      <UsersFilters
        search={search}
        status={status}
        tier={tier}
      />

      {/* Users Table */}
      <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
        <UsersTable
          users={users || []}
          currentPage={page}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}

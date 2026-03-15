'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UsersFiltersProps {
  search: string;
  status: string;
  tier: string;
}

export function UsersFilters({ search, status, tier }: UsersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== search) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchValue) {
          params.set('search', searchValue);
        } else {
          params.delete('search');
        }
        params.delete('page');
        router.push(`/admin/users?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue, search, searchParams, router]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Tier Filter */}
      <select
        value={tier}
        onChange={(e) => handleFilterChange('tier', e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >
        <option value="all">All Tiers</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
    </div>
  );
}

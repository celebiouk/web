'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Spinner } from '@/components/ui';

type SearchResult = {
  id: string;
  label: string;
  type: string;
  href: string;
};

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await response.json();
      setResults((json.results || []) as SearchResult[]);
      setLoading(false);
    }, 180);

    return () => clearTimeout(timeout);
  }, [query, open]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const item of results) {
      const current = map.get(item.type) || [];
      current.push(item);
      map.set(item.type, current);
    }
    return map;
  }, [results]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        Search… <span className="text-xs text-gray-400">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <Input autoFocus placeholder="Search products, orders, subscribers, bookings, courses..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
              ) : results.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">Type at least 2 characters to search.</div>
              ) : (
                Array.from(grouped.entries()).map(([type, items]) => (
                  <div key={type} className="mb-3">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{type}</p>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          setOpen(false);
                          router.push(item.href);
                        }}
                      >
                        <span className="text-sm text-gray-800 dark:text-gray-100">{item.label}</span>
                        <span className="text-xs text-gray-400">↵</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

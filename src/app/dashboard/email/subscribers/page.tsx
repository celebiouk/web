'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Spinner } from '@/components/ui';

type Subscriber = {
  id: string;
  email: string;
  first_name: string | null;
  source: string | null;
  tags: string[];
  subscribed_at: string | null;
  is_active: boolean;
};

export default function EmailSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    void loadSubscribers();
  }, []);

  async function loadSubscribers() {
    setLoading(true);
    const res = await fetch('/api/email/subscribers');
    const json = await res.json();
    setSubscribers((json.subscribers || []) as Subscriber[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) =>
      s.email.toLowerCase().includes(q) ||
      (s.first_name || '').toLowerCase().includes(q) ||
      (s.source || '').toLowerCase().includes(q)
    );
  }, [subscribers, search]);

  async function deleteSelected() {
    if (!selectedIds.length) return;
    await fetch(`/api/email/subscribers?ids=${selectedIds.join(',')}`, { method: 'DELETE' });
    setSelectedIds([]);
    await loadSubscribers();
  }

  async function addTagSelected() {
    if (!newTag.trim()) return;

    await Promise.all(selectedIds.map(async (id) => {
      const subscriber = subscribers.find((item) => item.id === id);
      if (!subscriber) return;
      const tags = Array.from(new Set([...(subscriber.tags || []), newTag.trim()]));
      await fetch('/api/email/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tags }),
      });
    }));

    setNewTag('');
    setSelectedIds([]);
    await loadSubscribers();
  }

  function exportCsv() {
    const header = 'email,first_name,source,tags,subscribed_at';
    const rows = filtered.map((s) => [
      s.email,
      s.first_name || '',
      s.source || '',
      (s.tags || []).join('|'),
      s.subscribed_at || '',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subscribers.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return;

    const [header, ...records] = lines;
    const cols = header.toLowerCase().split(',').map((v) => v.replace(/"/g, '').trim());
    const emailIndex = cols.findIndex((c) => c === 'email');
    const nameIndex = cols.findIndex((c) => c === 'first_name' || c === 'name');

    if (emailIndex < 0) return;

    const rows = records.map((line) => {
      const parts = line.split(',').map((v) => v.replace(/"/g, '').trim());
      return {
        email: parts[emailIndex],
        first_name: nameIndex >= 0 ? parts[nameIndex] : '',
      };
    }).filter((row) => row.email);

    await fetch('/api/email/subscribers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, source: 'import' }),
    });

    await loadSubscribers();
  }

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscribers</h1>
          <p className="text-gray-600 dark:text-gray-400">Search, tag, import, export, and manage your list.</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 px-3 py-2 text-sm">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} />
          </label>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search email, name, source..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input placeholder="Tag for selected" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            <Button variant="outline" onClick={addTagSelected} disabled={!selectedIds.length}>Add Tag</Button>
            <Button variant="danger" onClick={deleteSelected} disabled={!selectedIds.length}>Delete</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} subscribers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={(e) => setSelectedIds(e.target.checked ? filtered.map((s) => s.id) : [])} /></th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filtered.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(subscriber.id)} onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, subscriber.id] : prev.filter((id) => id !== subscriber.id))} /></td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{subscriber.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{subscriber.first_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{subscriber.source || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(subscriber.tags || []).map((tag) => <Badge key={tag} variant="default">{tag}</Badge>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{subscriber.subscribed_at ? new Date(subscriber.subscribed_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

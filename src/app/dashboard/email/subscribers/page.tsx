'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Users, Download, Upload, Tag, Trash2 } from 'lucide-react';

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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
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
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} subscriber(s)? This cannot be undone.`)) return;
    setBusy(true);
    await fetch(`/api/email/subscribers?ids=${selectedIds.join(',')}`, { method: 'DELETE' });
    setSelectedIds([]);
    await load();
    setBusy(false);
  }

  async function addTagToSelected() {
    if (!newTag.trim() || !selectedIds.length) return;
    setBusy(true);
    await Promise.all(selectedIds.map(async (id) => {
      const sub = subscribers.find((s) => s.id === id);
      if (!sub) return;
      const tags = Array.from(new Set([...(sub.tags || []), newTag.trim()]));
      await fetch('/api/email/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tags }),
      });
    }));
    setNewTag('');
    setSelectedIds([]);
    await load();
    setBusy(false);
  }

  function exportCsv() {
    const header = 'email,first_name,source,tags,subscribed_at';
    const rows = filtered.map((s) =>
      [s.email, s.first_name || '', s.source || '', (s.tags || []).join('|'), s.subscribed_at || '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const [header, ...records] = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const cols = header.toLowerCase().split(',').map((c) => c.replace(/"/g, '').trim());
    const emailIdx = cols.findIndex((c) => c === 'email');
    const nameIdx  = cols.findIndex((c) => c === 'first_name' || c === 'name');
    if (emailIdx < 0) return;
    const rows = records.map((line) => {
      const parts = line.split(',').map((v) => v.replace(/"/g, '').trim());
      return { email: parts[emailIdx], first_name: nameIdx >= 0 ? parts[nameIdx] : '' };
    }).filter((r) => r.email);
    await fetch('/api/email/subscribers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, source: 'import' }),
    });
    await load();
  }

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
            <Users className="h-4 w-4" /> Subscribers
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-100">
            {loading ? '…' : `${subscribers.length.toLocaleString()} subscribers`}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">Search, tag, import, and manage your list.</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100">
            <Upload className="h-3.5 w-3.5" /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} />
          </label>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email, name, source…"
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
        />
        {selectedIds.length > 0 && (
          <>
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag…"
              className="w-32 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={addTagToSelected}
              disabled={busy || !newTag.trim()}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
            >
              <Tag className="h-3.5 w-3.5" /> Tag {selectedIds.length}
            </button>
            <button
              onClick={deleteSelected}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete {selectedIds.length}
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">{search ? 'No subscribers match your search.' : 'No subscribers yet.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800">
              <tr className="text-left text-xs text-zinc-500">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => setSelectedIds(e.target.checked ? filtered.map((s) => s.id) : [])}
                    className="accent-indigo-500"
                  />
                </th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((s) => (
                <tr key={s.id} className="group">
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                        )
                      }
                      className="accent-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-zinc-100">{s.email}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{s.first_name || '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-500 text-xs">{s.source || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(s.tags || []).map((tag) => (
                        <span key={tag} className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

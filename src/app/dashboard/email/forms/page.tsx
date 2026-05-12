'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';

type ProductOption = { id: string; title: string; price: number };

export default function EmailFormsPage() {
  const [title, setTitle] = useState('Get my free guide');
  const [description, setDescription] = useState('Join my email list for updates and launches.');
  const [leadMagnetProductId, setLeadMagnetProductId] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/email/forms');
    const json = await res.json();
    setTitle(json.form?.title || 'Get my free guide');
    setDescription(json.form?.description || 'Join my email list for updates and launches.');
    setLeadMagnetProductId(json.form?.leadMagnetProductId || '');
    setProducts((json.products || []) as ProductOption[]);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch('/api/email/forms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, leadMagnetProductId: leadMagnetProductId || null }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
          <FileText className="h-4 w-4" /> Opt-in Form
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Email capture form</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          This form appears on your public storefront page to grow your subscriber list.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Form headline</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Get my free guide"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Incentive description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Lead magnet product{' '}
              <span className="font-normal text-zinc-600">(optional — delivered on signup)</span>
            </label>
            <select
              value={leadMagnetProductId}
              onChange={(e) => setLeadMagnetProductId(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">None — just collect the email</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save settings
            </button>
            {saved && <span className="text-xs text-emerald-400">Saved!</span>}
          </div>
        </div>
      )}
    </div>
  );
}

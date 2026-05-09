'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Monitor, Smartphone, Tablet, Sun, Moon, Trash2, Palette, Loader2, Download, Sparkles } from 'lucide-react';
import { EbookCanvas } from '@/components/celestudio/EbookCanvas';
import { DesignSystemPicker } from '@/components/celestudio/DesignSystemPicker';
import { DESIGN_SYSTEMS, type DesignSystemSlug } from '@/lib/celestudio/design-systems';
import type { Block } from '@/lib/celestudio/blocks';

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  design_system: DesignSystemSlug;
  status: string;
  blocks: Block[];
  published_product_id?: string | null;
}

type Viewport = 'desktop' | 'tablet' | 'mobile';

export function EbookViewerClient({ ebook }: { ebook: Ebook }) {
  const router = useRouter();
  const [designSystem, setDesignSystem] = useState<DesignSystemSlug>(ebook.design_system);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState<string | null>(ebook.published_product_id ?? null);

  async function changeDesignSystem(slug: DesignSystemSlug) {
    setDesignSystem(slug);
    setSavingDesign(true);
    try {
      await fetch(`/api/celestudio/ebooks/${ebook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design_system: slug }),
      });
    } finally {
      setSavingDesign(false);
    }
  }

  async function deleteEbook() {
    if (!confirm('Delete this ebook? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/celestudio/ebooks/${ebook.id}`, { method: 'DELETE' });
      router.push('/dashboard/celestudio');
    } catch {
      setDeleting(false);
    }
  }

  const ds = DESIGN_SYSTEMS[designSystem];
  const viewportWidth = { desktop: 980, tablet: 768, mobile: 420 }[viewport];

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0B]">
      {/* Top toolbar */}
      <div className="sticky top-0 z-30 border-b border-zinc-800/60 bg-[#0A0A0B]/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/celestudio"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-zinc-100">{ebook.title}</h1>
              <p className="truncate text-xs text-zinc-500">
                {ds.name}
                {savingDesign && <span className="ml-2 text-zinc-600">· saving</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Viewport switcher */}
            <div className="hidden items-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5 sm:flex">
              <ViewportButton active={viewport === 'desktop'} onClick={() => setViewport('desktop')}>
                <Monitor className="h-3.5 w-3.5" />
              </ViewportButton>
              <ViewportButton active={viewport === 'tablet'} onClick={() => setViewport('tablet')}>
                <Tablet className="h-3.5 w-3.5" />
              </ViewportButton>
              <ViewportButton active={viewport === 'mobile'} onClick={() => setViewport('mobile')}>
                <Smartphone className="h-3.5 w-3.5" />
              </ViewportButton>
            </div>

            {/* Light/dark toggle */}
            <button
              onClick={() => setMode(m => m === 'light' ? 'dark' : 'light')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}
            >
              {mode === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>

            {/* Design picker */}
            <button
              onClick={() => setShowDesignPicker(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Design</span>
            </button>

            {/* Download PDF — opens print view in new tab, browser handles save-as-PDF */}
            <Link
              href={`/dashboard/celestudio/${ebook.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Download as PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Link>

            {/* Publish to Cele.bio storefront */}
            <button
              onClick={() => setShowPublishModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity hover:opacity-90"
              title={publishedProductId ? 'Update published product' : 'Publish as a digital product'}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{publishedProductId ? 'Published' : 'Publish'}</span>
            </button>

            {/* Delete */}
            <button
              onClick={deleteEbook}
              disabled={deleting}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Publish modal */}
      {showPublishModal && (
        <PublishModal
          ebook={ebook}
          existingProductId={publishedProductId}
          onClose={() => setShowPublishModal(false)}
          onPublished={(productId) => {
            setPublishedProductId(productId);
            setShowPublishModal(false);
            router.push(`/dashboard/products/${productId}/edit`);
          }}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Design picker drawer */}
        {showDesignPicker && (
          <div className="w-80 shrink-0 overflow-y-auto border-r border-zinc-800/60 bg-zinc-950 p-4">
            <h2 className="mb-1 text-sm font-semibold text-zinc-100">Design System</h2>
            <p className="mb-4 text-xs text-zinc-500">Switch to instantly restyle the ebook.</p>
            <DesignSystemPicker
              value={designSystem}
              onChange={changeDesignSystem}
              isPro={true}
            />
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 sm:p-8">
          <div
            className="mx-auto rounded-xl shadow-2xl shadow-black/40 ring-1 ring-zinc-800/50 transition-all duration-300"
            style={{
              maxWidth: viewportWidth,
              background: mode === 'dark' ? ds.dark.page : ds.light.page,
            }}
          >
            <EbookCanvas blocks={ebook.blocks} designSystem={designSystem} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewportButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

// ── Publish modal ───────────────────────────────────────────────────────────

function PublishModal({
  ebook,
  existingProductId,
  onClose,
  onPublished,
}: {
  ebook: Ebook;
  existingProductId: string | null;
  onClose: () => void;
  onPublished: (productId: string) => void;
}) {
  const [price, setPrice] = useState('19.00');
  const [description, setDescription] = useState(ebook.subtitle ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid price (e.g. 19.00)');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/celestudio/ebooks/${ebook.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_cents: Math.round(parsedPrice * 100),
          description,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(typeof err.error === 'string' ? err.error : 'Failed to publish');
        setSubmitting(false);
        return;
      }
      const { product } = await res.json();
      onPublished(product.id);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {existingProductId ? 'Update product' : 'Publish to Cele.bio'}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">{existingProductId ? 'Update your published ebook' : 'Sell this ebook on your storefront'}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {existingProductId
            ? 'This ebook is already listed as a product. Adjust the price or description below.'
            : 'A new digital product will be created on your cele.bio page using this ebook\'s title and cover. You can refine it after.'}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Price (USD)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-7 pr-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-600">Set to 0 for a free download (lead magnet).</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Short description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A one-liner that sells the ebook on your storefront."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
              maxLength={500}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {existingProductId ? 'Update product' : 'Publish'}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

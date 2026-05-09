'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Monitor, Smartphone, Tablet, Sun, Moon, Trash2, Palette, Loader2 } from 'lucide-react';
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

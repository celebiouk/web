'use client';

import { useEffect, useState } from 'react';
import { EbookCanvas } from '@/components/celestudio/EbookCanvas';
import type { Block } from '@/lib/celestudio/blocks';
import type { DesignSystemSlug } from '@/lib/celestudio/design-systems';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  design_system: DesignSystemSlug;
  blocks: Block[];
}

export function PrintView({ ebook }: { ebook: Ebook }) {
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);

  // Auto-trigger the browser print dialog on first render so users
  // immediately see "Save as PDF" without an extra click.
  useEffect(() => {
    if (autoPrintTriggered) return;
    const timer = setTimeout(() => {
      window.print();
      setAutoPrintTriggered(true);
    }, 800); // small delay so images and fonts have a chance to load
    return () => clearTimeout(timer);
  }, [autoPrintTriggered]);

  return (
    <>
      {/* Toolbar — hidden when printing via @media print rules below */}
      <div className="celestudio-print-toolbar fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-5 py-3 backdrop-blur-sm">
        <Link
          href={`/dashboard/celestudio/${ebook.id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to editor
        </Link>
        <div className="text-sm text-zinc-400">
          Use your browser&apos;s Save as PDF option
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Canvas — pushed down so toolbar doesn't overlap */}
      <div className="celestudio-print-canvas pt-14 pb-12">
        <EbookCanvas blocks={ebook.blocks} designSystem={ebook.design_system} mode="light" />
      </div>

      {/* Print rules: hide ALL chrome (toolbar, sidebar, navbar), full-bleed canvas */}
      <style jsx global>{`
        @media print {
          /* Hide the in-page toolbar */
          .celestudio-print-toolbar { display: none !important; }
          .celestudio-print-canvas { padding-top: 0 !important; padding-bottom: 0 !important; }

          /* Hide everything from the parent dashboard layout */
          aside,
          header,
          nav,
          [class*="DashboardSidebar"],
          [class*="TopBar"],
          [class*="MobileNav"] { display: none !important; }

          /* Override the dashboard's left padding for sidebar */
          [class*="lg:pl-"] { padding-left: 0 !important; }

          @page {
            size: A4;
            margin: 1cm 1.2cm;
          }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </>
  );
}

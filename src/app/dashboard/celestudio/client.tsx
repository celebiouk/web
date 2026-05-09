'use client';

import Link from 'next/link';
import { DESIGN_SYSTEMS } from '@/lib/celestudio/design-systems';
import { ArrowUpRight } from 'lucide-react';

interface EbookSummary {
  id: string;
  title: string;
  subtitle: string | null;
  design_system: string;
  status: string;
  updated_at: string;
}

export function CelestudioListClient({ ebooks }: { ebooks: EbookSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ebooks.map(book => {
        const ds = DESIGN_SYSTEMS[book.design_system as keyof typeof DESIGN_SYSTEMS]
          ?? DESIGN_SYSTEMS['minimal-editorial'];

        return (
          <Link
            key={book.id}
            href={`/dashboard/celestudio/${book.id}`}
            className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 transition-all hover:border-zinc-700"
          >
            <div className="relative h-32 w-full" style={{ background: ds.previewGradient }}>
              <div className="absolute inset-x-4 inset-y-3 flex flex-col justify-between">
                <span
                  className="inline-block self-start rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                  style={{ background: `${ds.dark.surface}cc`, color: ds.dark.accent }}
                >
                  {book.status}
                </span>
                <div
                  className="text-sm font-semibold leading-tight line-clamp-2"
                  style={{ color: ds.dark.text, fontFamily: ds.fontHeading, letterSpacing: ds.letterSpacingHeading }}
                >
                  {book.title}
                </div>
              </div>
              <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 text-sm font-medium text-zinc-200">{book.title}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">{ds.name}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

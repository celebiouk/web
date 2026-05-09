'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Loader2, ChevronRight, Wand2 } from 'lucide-react';
import { DesignSystemPicker } from '@/components/celestudio/DesignSystemPicker';
import type { DesignSystemSlug } from '@/lib/celestudio/design-systems';

export function NewEbookClient({ authorName }: { authorName: string | null }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [designSystem, setDesignSystem] = useState<DesignSystemSlug>('minimal-editorial');
  const [step, setStep] = useState<'input' | 'design' | 'generating' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const charCount = text.length;
  const canProceed = charCount >= 50;

  async function handleGenerate() {
    setStep('generating');
    setErrorMessage(null);

    try {
      const genRes = await fetch('/api/celestudio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: text,
          designSystem,
          authorName: authorName ?? undefined,
        }),
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}));
        setErrorMessage(humanError(err?.error, genRes.status));
        setStep('error');
        return;
      }

      const generated = await genRes.json();

      const saveRes = await fetch('/api/celestudio/ebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generated.title,
          subtitle: generated.subtitle,
          designSystem,
          sourceText: text,
          blocks: generated.blocks,
        }),
      });

      if (!saveRes.ok) {
        setErrorMessage('Generated ebook but failed to save. Please try again.');
        setStep('error');
        return;
      }

      const { ebook } = await saveRes.json();
      router.push(`/dashboard/celestudio/${ebook.id}`);
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error. Please try again.');
      setStep('error');
    }
  }

  if (step === 'generating') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute -inset-4 animate-pulse rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-7 w-7 animate-pulse text-white" strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-zinc-100">Designing your ebook</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Our AI is structuring your content, choosing layouts, and composing a premium publication. This typically takes 20–40 seconds.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-zinc-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Working on it…</span>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-semibold text-zinc-100">Generation failed</h2>
        <p className="mt-2 text-sm text-zinc-500">{errorMessage}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setStep('input')}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Try Again
          </button>
          <Link
            href="/dashboard/celestudio"
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/celestudio"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CeleStudio
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={step === 'input' ? 'text-zinc-200' : ''}>1. Content</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step === 'design' ? 'text-zinc-200' : ''}>2. Design</span>
          <ChevronRight className="h-3 w-3" />
          <span>3. Generate</span>
        </div>
      </div>

      {step === 'input' && (
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Start with your content
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Paste your raw text. Notes, blog posts, transcripts, outlines — any messy form. AI will structure it.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Sweet spot: 500–3,000 words. Generation takes ~30–50 seconds.
          </p>

          <div className="relative mt-7">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 25000))}
              placeholder="Paste your content here. Aim for 500–3,000 words for the best result."
              rows={16}
              maxLength={25000}
              className="w-full resize-y rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-[15px] leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="absolute bottom-3 right-4 flex items-center gap-2 text-xs">
              <span className={
                charCount < 50 ? 'text-amber-500'
                : charCount > 18000 ? 'text-amber-500'
                : 'text-zinc-500'
              }>
                {charCount.toLocaleString()} / 25,000 chars
              </span>
              {charCount < 50 && (
                <span className="text-amber-500">· need {50 - charCount} more</span>
              )}
              {charCount > 18000 && charCount <= 25000 && (
                <span className="text-amber-500">· may time out, consider shortening</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep('design')}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Choose Design
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {step === 'design' && (
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Pick a design system
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Each system controls typography, layout, and visual rhythm. You can change this later.
          </p>

          <div className="mt-7">
            <DesignSystemPicker
              value={designSystem}
              onChange={setDesignSystem}
              isPro={true}
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep('input')}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              ← Back to content
            </button>
            <button
              onClick={handleGenerate}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <Wand2 className="h-4 w-4" strokeWidth={2} />
              Generate Ebook
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function humanError(code: unknown, status: number): string {
  // Special-cased friendly translations
  if (code === 'pro_required' || status === 402) return 'CeleStudio is a Pro feature. Please upgrade to continue.';
  if (status === 429 || status === 503) return 'AI is busy right now. Please try again in a minute.';

  // 504 = Vercel function timeout. The AI took too long to respond.
  // Specific guidance because this is the most common failure mode on Hobby.
  if (status === 504) {
    return 'Generation took too long and was cut off (60s server limit). Please try again with a shorter source text — under 3,000 words is ideal. Your OpenAI credits were used since the AI did the work, sorry.';
  }

  // Pass through any string error message from the server so we can SEE what's wrong
  if (typeof code === 'string' && code.length > 0) return code;

  // Object error (e.g. Zod validation) — extract a usable message
  if (code && typeof code === 'object') {
    try { return `Server error: ${JSON.stringify(code).slice(0, 300)}`; } catch { /* fall through */ }
  }

  return `Something went wrong (status ${status}). Please try again.`;
}

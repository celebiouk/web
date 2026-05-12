import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Unsubscribed — Cele.bio' };

export default function UnsubscribedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-100">You&apos;re unsubscribed</h1>
        <p className="mb-6 text-sm text-zinc-400">
          You won&apos;t receive any more emails from this creator. No further action is needed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          Back to Cele.bio
        </Link>
      </div>
    </div>
  );
}

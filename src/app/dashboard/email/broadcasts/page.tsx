'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Send } from 'lucide-react';

type Broadcast = {
  id: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  recipient_count: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  sent:      'bg-emerald-500/15 text-emerald-300',
  scheduled: 'bg-indigo-500/15 text-indigo-300',
  sending:   'bg-amber-500/15 text-amber-300',
  draft:     'bg-zinc-800 text-zinc-400',
};

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/email/broadcasts');
    const json = await res.json();
    setBroadcasts((json.broadcasts || []) as Broadcast[]);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
            <Send className="h-4 w-4" /> Broadcasts
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Campaigns</h1>
          <p className="mt-0.5 text-sm text-zinc-500">One-time emails sent to all or a segment of your list.</p>
        </div>
        <Link
          href="/dashboard/email/broadcasts/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" /> New broadcast
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
          <p className="text-sm text-zinc-400">No broadcasts yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Hit "New broadcast" to draft and send your first campaign.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/30">
          {broadcasts.map((b) => (
            <li key={b.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{b.subject}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {b.sent_at
                    ? `Sent ${new Date(b.sent_at).toLocaleDateString()}`
                    : b.scheduled_at
                    ? `Scheduled for ${new Date(b.scheduled_at).toLocaleString()}`
                    : `Created ${new Date(b.created_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {b.recipient_count > 0 && (
                  <span className="text-xs text-zinc-500">
                    {b.recipient_count.toLocaleString()} recipients
                  </span>
                )}
                <span
                  className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_STYLES[b.status] ?? STATUS_STYLES.draft}`}
                >
                  {b.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

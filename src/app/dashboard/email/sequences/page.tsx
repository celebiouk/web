'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Zap, Plus } from 'lucide-react';

type Sequence = {
  id: string;
  name: string;
  trigger: 'new_subscriber' | 'product_purchase' | 'course_enrollment' | 'booking';
  is_active: boolean;
};

type Step = {
  sequence_id: string;
  position: number;
  delay_days: number;
  subject: string;
  body_html: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  new_subscriber:   'New subscriber',
  product_purchase: 'Product purchase',
  course_enrollment:'Course enrollment',
  booking:          'Booking completed',
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('Welcome Flow');
  const [trigger, setTrigger] = useState<Sequence['trigger']>('new_subscriber');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/email/sequences');
    const json = await res.json();
    setSequences((json.sequences || []) as Sequence[]);
    setSteps((json.steps || []) as Step[]);
    setLoading(false);
  }

  const groupedSteps = useMemo(() => {
    const map = new Map<string, Step[]>();
    for (const step of steps) {
      const existing = map.get(step.sequence_id) || [];
      existing.push(step);
      map.set(step.sequence_id, existing.sort((a, b) => a.position - b.position));
    }
    return map;
  }, [steps]);

  async function createSequence() {
    setCreating(true);
    await fetch('/api/email/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        trigger,
        is_active: true,
        steps: [
          { position: 0, delay_days: 0, subject: 'Welcome {{first_name}}', body_html: '<p>Hey {{first_name}}, welcome! 👋</p>' },
          { position: 1, delay_days: 1, subject: 'Quick win for you', body_html: '<p>Here\'s one tactic you can use today.</p>' },
        ],
      }),
    });
    await load();
    setCreating(false);
  }

  async function toggle(seq: Sequence) {
    setTogglingId(seq.id);
    await fetch('/api/email/sequences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seq.id, is_active: !seq.is_active }),
    });
    await load();
    setTogglingId(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
          <Zap className="h-4 w-4" /> Sequences
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Automated sequences</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Drip emails triggered by signups, purchases, enrollments, and bookings.
        </p>
      </div>

      {/* Create form */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">New sequence</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-36">
            <label className="mb-1 block text-xs text-zinc-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome Flow"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-44">
            <label className="mb-1 block text-xs text-zinc-400">Trigger</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as Sequence['trigger'])}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="new_subscriber">New subscriber</option>
              <option value="product_purchase">Product purchase</option>
              <option value="course_enrollment">Course enrollment</option>
              <option value="booking">Booking completed</option>
            </select>
          </div>
          <button
            onClick={createSequence}
            disabled={creating || !name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">No sequences yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Create one above to start automating your follow-ups.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <div key={seq.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-100">{seq.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Trigger: {TRIGGER_LABELS[seq.trigger] ?? seq.trigger}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      seq.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {seq.is_active ? 'Active' : 'Paused'}
                  </span>
                  <button
                    onClick={() => toggle(seq)}
                    disabled={togglingId === seq.id}
                    className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
                  >
                    {togglingId === seq.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : seq.is_active ? 'Pause' : 'Enable'}
                  </button>
                </div>
              </div>
              {(groupedSteps.get(seq.id) || []).length > 0 && (
                <ol className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3">
                  {(groupedSteps.get(seq.id) || []).map((step) => (
                    <li key={`${seq.id}-${step.position}`} className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] text-zinc-500">
                        {step.position + 1}
                      </span>
                      <span>
                        Day {step.delay_days} —{' '}
                        <span className="font-medium text-zinc-300">{step.subject}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

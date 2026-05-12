'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import {
  ArrowLeft, Loader2, Plus, Trash2, Edit2, Check, X,
  Zap, Bold, Italic, List,
} from 'lucide-react';
import Link from 'next/link';

type TriggerType = 'new_subscriber' | 'product_purchase' | 'course_enrollment' | 'booking';

interface Sequence {
  id: string;
  name: string;
  trigger: TriggerType;
  trigger_product_id: string | null;
  is_active: boolean;
}

interface Step {
  id?: string;
  sequence_id: string;
  position: number;
  delay_days: number;
  send_at_hour: number;
  send_at_minute: number;
  subject: string;
  body_html: string;
}

interface Product {
  id: string;
  title: string;
  price_cents: number;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  new_subscriber:    'New subscriber joins list',
  product_purchase:  'Someone downloads / buys a product',
  course_enrollment: 'Someone enrols in a course',
  booking:           'Booking completed',
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

function fmtTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'} UTC`;
}

// ─── Step editor sub-component ──────────────────────────────────────────────
function StepEditor({
  initial,
  nextPosition,
  onSave,
  onCancel,
}: {
  initial?: Step;
  nextPosition: number;
  onSave: (data: Omit<Step, 'id' | 'sequence_id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [delayDays, setDelayDays]     = useState(initial?.delay_days ?? nextPosition === 0 ? 0 : 1);
  const [sendHour, setSendHour]       = useState(initial?.send_at_hour ?? 9);
  const [sendMinute, setSendMinute]   = useState(initial?.send_at_minute ?? 0);
  const [subject, setSubject]         = useState(initial?.subject ?? '');
  const [saving, setSaving]           = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink],
    content: initial?.body_html ?? '<p>Hey {{first_name}},</p><p></p>',
  });

  async function handleSave() {
    if (!subject.trim() || !editor) return;
    setSaving(true);
    await onSave({
      position:       initial?.position ?? nextPosition,
      delay_days:     delayDays,
      send_at_hour:   sendHour,
      send_at_minute: sendMinute,
      subject:        subject.trim(),
      body_html:      editor.getHTML(),
    });
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-zinc-900/60 p-4 space-y-3">
      {/* Timing row */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Send on day</label>
          <input
            type="number"
            min={0}
            max={365}
            value={delayDays}
            onChange={(e) => setDelayDays(Math.max(0, Number(e.target.value)))}
            className="w-20 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-zinc-600">0 = immediately</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">At hour (UTC)</label>
          <select
            value={sendHour}
            onChange={(e) => setSendHour(Number(e.target.value))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Minute</label>
          <select
            value={sendMinute}
            onChange={(e) => setSendMinute(Number(e.target.value))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="mb-1 block text-xs text-zinc-400">Subject line</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject — tokens: {{first_name}}, {{creator_name}}"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Body */}
      <div>
        <label className="mb-1 block text-xs text-zinc-400">Email body</label>
        <div className="mb-1.5 flex gap-1.5">
          {[
            { icon: <Bold className="h-3.5 w-3.5" />, action: () => editor?.chain().focus().toggleBold().run() },
            { icon: <Italic className="h-3.5 w-3.5" />, action: () => editor?.chain().focus().toggleItalic().run() },
            { icon: <List className="h-3.5 w-3.5" />, action: () => editor?.chain().focus().toggleBulletList().run() },
          ].map(({ icon, action }, i) => (
            <button
              key={i}
              type="button"
              onClick={action}
              className="rounded border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:text-zinc-200"
            >
              {icon}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
          <EditorContent
            editor={editor}
            className="min-h-[140px] text-sm text-zinc-100 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_a]:text-indigo-400"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !subject.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save email
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function FunnelBuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings edit state
  const [settingsName, setSettingsName]       = useState('');
  const [settingsTrigger, setSettingsTrigger] = useState<TriggerType>('new_subscriber');
  const [settingsProductId, setSettingsProductId] = useState<string>('');
  const [settingsActive, setSettingsActive]   = useState(true);
  const [savingSettings, setSavingSettings]   = useState(false);
  const [settingsSaved, setSettingsSaved]     = useState(false);

  // Step editing
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [addingStep, setAddingStep]           = useState(false);
  const [deletingPosition, setDeletingPosition] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/email/sequences/${params.id}`);
    if (!res.ok) { router.push('/dashboard/email/sequences'); return; }
    const data = await res.json();
    setSequence(data.sequence);
    setSteps(data.steps);
    setProducts(data.products);
    setSettingsName(data.sequence.name);
    setSettingsTrigger(data.sequence.trigger);
    setSettingsProductId(data.sequence.trigger_product_id ?? '');
    setSettingsActive(data.sequence.is_active);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { void load(); }, [load]);

  async function saveSettings() {
    setSavingSettings(true);
    await fetch(`/api/email/sequences/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: settingsName,
        trigger: settingsTrigger,
        trigger_product_id: settingsProductId || null,
        is_active: settingsActive,
      }),
    });
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    if (sequence) setSequence({ ...sequence, name: settingsName, trigger: settingsTrigger, trigger_product_id: settingsProductId || null, is_active: settingsActive });
  }

  async function saveNewStep(data: Omit<Step, 'id' | 'sequence_id'>) {
    await fetch(`/api/email/sequences/${params.id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setAddingStep(false);
    await load();
  }

  async function updateStep(position: number, data: Omit<Step, 'id' | 'sequence_id'>) {
    await fetch(`/api/email/sequences/${params.id}/steps/${position}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditingPosition(null);
    await load();
  }

  async function deleteStep(position: number) {
    if (!confirm('Delete this email from the funnel?')) return;
    setDeletingPosition(position);
    await fetch(`/api/email/sequences/${params.id}/steps/${position}`, { method: 'DELETE' });
    setDeletingPosition(null);
    await load();
  }

  const nextPosition = useMemo(() => steps.length, [steps]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back */}
      <Link
        href="/dashboard/email/sequences"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sequences
      </Link>

      {/* Settings card */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
          <Zap className="h-4 w-4" /> Funnel settings
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-zinc-400">Funnel name</label>
          <input
            value={settingsName}
            onChange={(e) => setSettingsName(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-zinc-400">Trigger — when does someone enter this funnel?</label>
          <select
            value={settingsTrigger}
            onChange={(e) => setSettingsTrigger(e.target.value as TriggerType)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            {(Object.entries(TRIGGER_LABELS) as [TriggerType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {(settingsTrigger === 'product_purchase') && (
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">
              Which product triggers this funnel?
              <span className="ml-1 text-zinc-600">(free or paid — anyone who downloads/buys enters here)</span>
            </label>
            <select
              value={settingsProductId}
              onChange={(e) => setSettingsProductId(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">— Pick a product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.price_cents === 0 ? ' (free)' : ` ($${(p.price_cents / 100).toFixed(2)})`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            role="switch"
            aria-checked={settingsActive}
            onClick={() => setSettingsActive((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition ${settingsActive ? 'bg-indigo-500' : 'bg-zinc-700'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settingsActive ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
          <span className="text-sm text-zinc-300">{settingsActive ? 'Active' : 'Paused'}</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
            Save settings
          </button>
          {settingsSaved && <span className="text-xs text-emerald-400">Saved!</span>}
        </div>
      </div>

      {/* Funnel timeline */}
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
        Your email funnel
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          {steps.length} email{steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.position} className="relative">
            {/* Connecting line between steps */}
            {i < steps.length - 1 && (
              <div className="absolute left-5 top-full z-10 h-4 w-px bg-zinc-700" />
            )}

            {editingPosition === step.position ? (
              <StepEditor
                initial={step}
                nextPosition={nextPosition}
                onSave={(data) => updateStep(step.position, data)}
                onCancel={() => setEditingPosition(null)}
              />
            ) : (
              <div className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 mb-4">
                {/* Position bubble */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-400">
                  {step.position + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-zinc-500">
                        {step.delay_days === 0
                          ? 'Immediately on entry'
                          : `Day ${step.delay_days} · ${fmtTime(step.send_at_hour, step.send_at_minute)}`}
                      </p>
                      <p className="mt-0.5 font-medium text-zinc-100">{step.subject}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{stripHtml(step.body_html)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setEditingPosition(step.position)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStep(step.position)}
                        disabled={deletingPosition === step.position}
                        className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingPosition === step.position
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add step form */}
        {addingStep ? (
          <div className="mt-4">
            <StepEditor
              nextPosition={nextPosition}
              onSave={saveNewStep}
              onCancel={() => setAddingStep(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => { setEditingPosition(null); setAddingStep(true); }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-4 text-sm text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
          >
            <Plus className="h-4 w-4" /> Add email to funnel
          </button>
        )}
      </div>

      {steps.length === 0 && !addingStep && (
        <p className="mt-2 text-center text-xs text-zinc-600">
          Add your first email above. Day 0 sends immediately when someone enters the funnel.
        </p>
      )}
    </div>
  );
}

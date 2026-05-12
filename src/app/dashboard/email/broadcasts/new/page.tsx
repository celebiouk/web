'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { Loader2, Send, Bold, Italic, List, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

const DEFAULT_CONTENT =
  "<p>Hey {{first_name}},</p><p>Big news from {{creator_name}}. Here's what's new:</p><p><strong>...</strong></p><p><a href='https://cele.bio'>Read more →</a></p>";

type SegmentType = 'all' | 'tag' | 'product' | 'course_students' | 'buyers';

export default function NewBroadcastPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [segmentType, setSegmentType] = useState<SegmentType>('all');
  const [segmentValue, setSegmentValue] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [showTestField, setShowTestField] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink, TiptapImage],
    content: DEFAULT_CONTENT,
  });

  const bodyHtml = useMemo(() => editor?.getHTML() ?? '<p></p>', [editor]);

  function commonPayload() {
    return {
      subject,
      preview_text: previewText,
      body_html: bodyHtml,
      segment: { type: segmentType, value: segmentValue || undefined },
    };
  }

  async function saveDraft() {
    setStatus(null);
    setIsBusy(true);
    try {
      const res = await fetch('/api/email/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...commonPayload(), status: 'draft' }),
      });
      const json = await res.json();
      setStatus({ ok: res.ok, msg: res.ok ? 'Draft saved.' : (json.error ?? 'Failed to save.') });
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTest() {
    if (!testEmail.trim()) { setShowTestField(true); return; }
    setStatus(null);
    setIsBusy(true);
    try {
      const res = await fetch('/api/email/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...commonPayload(), sendNow: true, testEmail: testEmail.trim() }),
      });
      const json = await res.json();
      setStatus({ ok: res.ok, msg: res.ok ? `Test sent to ${testEmail}.` : (json.error ?? 'Failed to send test.') });
    } finally {
      setIsBusy(false);
    }
  }

  async function scheduleLater() {
    if (!scheduledAt) return;
    setStatus(null);
    setIsBusy(true);
    try {
      const res = await fetch('/api/email/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...commonPayload(),
          sendNow: false,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: 'Broadcast scheduled.' });
        setTimeout(() => router.push('/dashboard/email/broadcasts'), 1200);
      } else {
        setStatus({ ok: false, msg: json.error ?? 'Failed to schedule.' });
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function sendNow() {
    setStatus(null);
    setIsBusy(true);
    try {
      const res = await fetch('/api/email/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...commonPayload(), sendNow: true }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus({ ok: true, msg: `Broadcast sent to ${json.sent ?? 0} recipients.` });
        setTimeout(() => router.push('/dashboard/email/broadcasts'), 1500);
      } else {
        setStatus({ ok: false, msg: json.error ?? 'Failed to send.' });
      }
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
          <Send className="h-4 w-4" /> New broadcast
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Compose campaign</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Tokens: <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-300">{'{{first_name}}'}</code>{' '}
          <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-300">{'{{creator_name}}'}</code>
        </p>
      </div>

      {status && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            status.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {status.msg}
        </div>
      )}

      <div className="space-y-4">
        {/* Audience */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Audience</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">To</label>
              <select
                value={segmentType}
                onChange={(e) => setSegmentType(e.target.value as SegmentType)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All subscribers</option>
                <option value="tag">By tag</option>
                <option value="buyers">Buyers of a product</option>
                <option value="course_students">Course students</option>
              </select>
            </div>
            {segmentType !== 'all' && (
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  {segmentType === 'tag' ? 'Tag name' : 'Product / course ID'}
                </label>
                <input
                  value={segmentValue}
                  onChange={(e) => setSegmentValue(e.target.value)}
                  placeholder={segmentType === 'tag' ? 'e.g. vip' : 'Paste the ID'}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </section>

        {/* Subject + preview */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Subject line</h2>
          <div className="space-y-2">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Preview text (shown in inbox before opening)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </section>

        {/* Body editor */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Body</h2>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {[
              { icon: <Bold className="h-3.5 w-3.5" />, action: () => editor?.chain().focus().toggleBold().run(), label: 'Bold' },
              { icon: <Italic className="h-3.5 w-3.5" />, action: () => editor?.chain().focus().toggleItalic().run(), label: 'Italic' },
              { icon: <List className="h-3.5 w-3.5" />, action: () => editor?.chain().focus().toggleBulletList().run(), label: 'Bullets' },
              {
                icon: <ImageIcon className="h-3.5 w-3.5" />,
                action: () => {
                  const url = window.prompt('Image URL');
                  if (url) editor?.chain().focus().setImage({ src: url }).run();
                },
                label: 'Image',
              },
              {
                icon: <LinkIcon className="h-3.5 w-3.5" />,
                action: () => {
                  const url = window.prompt('Link URL');
                  if (url) editor?.chain().focus().setLink({ href: url }).run();
                },
                label: 'Link',
              },
            ].map(({ icon, action, label }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
            <EditorContent
              editor={editor}
              className="min-h-[200px] text-sm text-zinc-100 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_a]:text-indigo-400"
            />
          </div>
        </section>

        {/* Send options */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Send options</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Schedule for later (optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {showTestField && (
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Test email address</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={saveDraft}
              disabled={isBusy}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              onClick={() => {
                if (!showTestField) { setShowTestField(true); return; }
                void sendTest();
              }}
              disabled={isBusy}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
            >
              {showTestField ? 'Send test' : 'Send test email'}
            </button>
            <button
              onClick={scheduleLater}
              disabled={isBusy || !scheduledAt}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule
            </button>
            <button
              onClick={sendNow}
              disabled={isBusy || !subject.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Send now
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

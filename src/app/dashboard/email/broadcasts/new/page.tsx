'use client';

import { useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';

const DEFAULT_CONTENT = '<p>Hey {{first_name}},</p><p>Big update from {{creator_name}}. Here\'s what\'s new:</p><p><strong>...</strong></p><p><a href="https://cele.bio">Read more</a></p>';

export default function NewBroadcastPage() {
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [segmentType, setSegmentType] = useState<'all' | 'tag' | 'product' | 'course_students' | 'buyers'>('all');
  const [segmentValue, setSegmentValue] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSending, setIsSending] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link, Image],
    content: DEFAULT_CONTENT,
  });

  const bodyHtml = useMemo(() => editor?.getHTML() || '<p></p>', [editor]);

  async function saveDraft() {
    await fetch('/api/email/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        preview_text: previewText,
        body_html: bodyHtml,
        segment: { type: segmentType, value: segmentValue || undefined },
        status: 'draft',
      }),
    });
  }

  async function sendNow(test = false) {
    setIsSending(true);

    await fetch('/api/email/broadcast/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        preview_text: previewText,
        body_html: bodyHtml,
        segment: { type: segmentType, value: segmentValue || undefined },
        sendNow: true,
        testEmail: test ? prompt('Send test to email:') || undefined : undefined,
      }),
    });

    setIsSending(false);
  }

  async function scheduleLater() {
    await fetch('/api/email/broadcast/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        preview_text: previewText,
        body_html: bodyHtml,
        segment: { type: segmentType, value: segmentValue || undefined },
        sendNow: false,
        scheduledAt,
      }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Broadcast</h1>
        <p className="text-gray-600 dark:text-gray-400">Compose and send a campaign to your selected audience.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Audience</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">To</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
              value={segmentType}
              onChange={(e) => setSegmentType(e.target.value as any)}
            >
              <option value="all">All subscribers</option>
              <option value="tag">By tag</option>
              <option value="buyers">Buyers of product</option>
              <option value="course_students">Course students</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Segment value</label>
            <Input value={segmentValue} onChange={(e) => setSegmentValue(e.target.value)} placeholder="Tag or ID (if needed)" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subject & Preview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Subject line" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Input placeholder="Preview text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Body (Tiptap)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</Button>
            <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</Button>
            <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bullets</Button>
            <Button size="sm" variant="outline" onClick={() => {
              const url = prompt('Image URL');
              if (url) editor?.chain().focus().setImage({ src: url }).run();
            }}>Image</Button>
            <Button size="sm" variant="outline" onClick={() => {
              const url = prompt('CTA URL');
              if (url) editor?.chain().focus().setLink({ href: url }).run();
            }}>Link</Button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <EditorContent editor={editor} className="min-h-[240px] prose max-w-none dark:prose-invert" />
          </div>
          <p className="text-xs text-gray-500">Tokens: {'{{first_name}}'}, {'{{creator_name}}'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Send options</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Schedule time (optional)</label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
            <Button variant="outline" onClick={() => void sendNow(true)}>Send Test</Button>
            <Button variant="outline" onClick={scheduleLater} disabled={!scheduledAt}>Schedule</Button>
            <Button onClick={() => void sendNow(false)} disabled={isSending || !subject}>Send Now</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
} from 'lucide-react';

// TikTok logo SVG inline (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.27 8.27 0 0 0 4.84 1.55V6.86a4.85 4.85 0 0 1-1.07-.17z"/>
    </svg>
  );
}

interface TikTokConnection {
  tiktok_username: string | null;
  tiktok_open_id: string;
  created_at: string;
}

interface Trigger {
  id: string;
  keyword: string;
  match_type: 'contains' | 'exact' | 'starts_with';
  comment_reply: string;
  is_active: boolean;
  created_at: string;
}

const MATCH_LABELS: Record<string, string> = {
  contains: 'Comment contains',
  exact: 'Comment is exactly',
  starts_with: 'Comment starts with',
};

export default function TikTokAutomationPage() {
  const [connection, setConnection] = useState<TikTokConnection | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    keyword: '',
    match_type: 'contains' as 'contains' | 'exact' | 'starts_with',
    comment_reply: '',
  });

  const replyCharsLeft = 150 - form.comment_reply.length;

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/dashboard/tiktok-automation');
    }
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [connRes, trigRes] = await Promise.all([
        fetch('/api/tiktok/automation/connection'),
        fetch('/api/tiktok/automation/triggers'),
      ]);
      if (connRes.ok) {
        const d = await connRes.json();
        setConnection(d.connection);
      }
      if (trigRes.ok) {
        const d = await trigRes.json();
        setTriggers(d.triggers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveTrigger() {
    if (!form.keyword || !form.comment_reply) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tiktok/automation/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setTriggers(prev => [d.trigger, ...prev]);
        setForm({ keyword: '', match_type: 'contains', comment_reply: '' });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleTrigger(trigger: Trigger) {
    await fetch('/api/tiktok/automation/triggers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trigger.id, is_active: !trigger.is_active }),
    });
    setTriggers(prev =>
      prev.map(t => t.id === trigger.id ? { ...t, is_active: !t.is_active } : t)
    );
  }

  async function deleteTrigger(id: string) {
    await fetch(`/api/tiktok/automation/triggers?id=${id}`, { method: 'DELETE' });
    setTriggers(prev => prev.filter(t => t.id !== id));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
            <TikTokIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">TikTok Automation</h1>
            <p className="text-sm text-zinc-500">
              Auto-reply to comments when someone uses a keyword on your videos
            </p>
          </div>
        </div>
      </div>

      {/* Polling note */}
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <p className="text-xs text-zinc-500">
          <strong className="text-zinc-400">Polling mode:</strong> TikTok doesn&apos;t support real-time webhooks, so Cele.bio checks your latest 5 videos for new comments every 5 minutes. Replies may be slightly delayed compared to Instagram automation.
        </p>
      </div>

      {/* Connection card */}
      <div className="mb-6 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">TikTok Account</p>
            {connection ? (
              <p className="mt-0.5 text-sm text-zinc-500">
                Connected as{' '}
                <span className="font-medium text-white">
                  @{connection.tiktok_username ?? connection.tiktok_open_id}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-zinc-500">
                Connect your TikTok account to enable comment automation
              </p>
            )}
          </div>
          {connection ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Connected</span>
            </div>
          ) : (
            <a
              href="/api/tiktok/automation/auth/start"
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              <TikTokIcon className="h-4 w-4" />
              Connect TikTok
            </a>
          )}
        </div>

        {!connection && (
          <div className="mt-4 rounded-lg bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-400/90">
                Your TikTok developer app must have the <strong>Comment API</strong> product enabled and the scopes{' '}
                <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">video.list</code>,{' '}
                <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">comment.list</code>, and{' '}
                <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">comment.create</code> approved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: MessageCircle, label: 'Someone comments a keyword on any of your last 5 videos', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Clock, label: 'Cele.bio polls TikTok every 5 minutes and detects the match', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { icon: Zap, label: 'Auto-reply is posted directly under their comment', color: 'text-white', bg: 'bg-zinc-800' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 text-center">
            <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Triggers */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50">
        <div className="flex items-center justify-between border-b border-zinc-800/60 p-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Keyword Triggers</h2>
            <p className="text-xs text-zinc-500">{triggers.length} trigger{triggers.length !== 1 ? 's' : ''} set up</p>
          </div>
          {connection && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Trigger
            </button>
          )}
        </div>

        {showForm && (
          <div className="border-b border-zinc-800/60 p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. LINK, FREE, INFO"
                    value={form.keyword}
                    onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Match Type</label>
                  <select
                    value={form.match_type}
                    onChange={e => setForm(f => ({ ...f, match_type: e.target.value as typeof form.match_type }))}
                    className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
                  >
                    <option value="contains">Comment contains keyword</option>
                    <option value="exact">Comment is exactly keyword</option>
                    <option value="starts_with">Comment starts with keyword</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">
                  <span>Comment Reply</span>
                  <span className={replyCharsLeft < 20 ? 'text-amber-400' : 'text-zinc-600'}>
                    {replyCharsLeft} chars left
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Check the link in my bio! 🔥 cele.bio/yourname"
                  value={form.comment_reply}
                  onChange={e => setForm(f => ({ ...f, comment_reply: e.target.value.slice(0, 150) }))}
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
                />
                <p className="mt-1 text-[11px] text-zinc-600">TikTok comments are limited to 150 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveTrigger}
                  disabled={saving || !form.keyword || !form.comment_reply}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Trigger
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {triggers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60">
              <Zap className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No triggers yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              {connection ? 'Add your first keyword trigger above' : 'Connect your TikTok account first'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {triggers.map(trigger => (
              <div key={trigger.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-zinc-800/60 px-2.5 py-1">
                      <span className="font-mono text-sm font-semibold text-zinc-200">{trigger.keyword}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{MATCH_LABELS[trigger.match_type]}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      trigger.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {trigger.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleTrigger(trigger)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      {trigger.is_active
                        ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                        : <ToggleLeft className="h-5 w-5" />
                      }
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === trigger.id ? null : trigger.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      {expandedId === trigger.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteTrigger(trigger.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {expandedId === trigger.id && (
                  <div className="mt-4">
                    <div className="rounded-lg bg-zinc-800/40 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-zinc-400">Comment Reply</span>
                      </div>
                      <p className="text-sm text-zinc-300">{trigger.comment_reply}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DM note */}
      <div className="mt-4 rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4">
        <div className="flex gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Why no DMs?</strong> TikTok does not have a public API for sending direct messages to users. To drive traffic, include your Cele.bio link directly in your comment reply — e.g.{' '}
            <em>"Check the link in my bio! cele.bio/yourname"</em>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Instagram,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

interface InstagramConnection {
  ig_username: string | null;
  page_name: string | null;
  created_at: string;
}

interface Trigger {
  id: string;
  keyword: string;
  match_type: 'contains' | 'exact' | 'starts_with';
  comment_reply: string;
  dm_message: string;
  is_active: boolean;
  created_at: string;
}

const MATCH_LABELS: Record<string, string> = {
  contains: 'Comment contains',
  exact: 'Comment is exactly',
  starts_with: 'Comment starts with',
};

export default function InstagramAutomationPage() {
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    keyword: '',
    match_type: 'contains' as 'contains' | 'exact' | 'starts_with',
    comment_reply: '',
    dm_message: '',
  });

  useEffect(() => {
    loadData();

    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/dashboard/instagram-automation');
    }
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [connRes, trigRes] = await Promise.all([
        fetch('/api/instagram/connection'),
        fetch('/api/instagram/triggers'),
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
    if (!form.keyword || !form.comment_reply || !form.dm_message) return;
    setSaving(true);
    try {
      const res = await fetch('/api/instagram/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setTriggers(prev => [d.trigger, ...prev]);
        setForm({ keyword: '', match_type: 'contains', comment_reply: '', dm_message: '' });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleTrigger(trigger: Trigger) {
    await fetch('/api/instagram/triggers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trigger.id, is_active: !trigger.is_active }),
    });
    setTriggers(prev =>
      prev.map(t => t.id === trigger.id ? { ...t, is_active: !t.is_active } : t)
    );
  }

  async function deleteTrigger(id: string) {
    await fetch(`/api/instagram/triggers?id=${id}`, { method: 'DELETE' });
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Instagram Automation</h1>
            <p className="text-sm text-zinc-500">
              Auto-reply to comments + send DMs when someone uses a keyword
            </p>
          </div>
        </div>
      </div>

      {/* Connection card */}
      <div className="mb-6 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">Instagram Account</p>
            {connection ? (
              <p className="mt-0.5 text-sm text-zinc-500">
                Connected as{' '}
                <span className="font-medium text-pink-400">@{connection.ig_username ?? connection.page_name}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-zinc-500">
                Connect your Instagram Business or Creator account to get started
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
              href="/api/instagram/auth/start"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Instagram className="h-4 w-4" />
              Connect Instagram
            </a>
          )}
        </div>

        {!connection && (
          <div className="mt-4 rounded-lg bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-400/90">
                Your Instagram must be a <strong>Business</strong> or <strong>Creator</strong> account linked to a Facebook Page. Personal accounts are not supported by Meta&apos;s API.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: MessageCircle, label: 'Someone comments a keyword on your post', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Zap, label: 'Cele.bio instantly detects the keyword trigger', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { icon: Send, label: 'Auto-reply to comment + send them a DM', color: 'text-pink-400', bg: 'bg-pink-500/10' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 text-center">
            <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Triggers section */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50">
        <div className="flex items-center justify-between border-b border-zinc-800/60 p-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Keyword Triggers</h2>
            <p className="text-xs text-zinc-500">{triggers.length} trigger{triggers.length !== 1 ? 's' : ''} set up</p>
          </div>
          {connection && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 py-1.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Trigger
            </button>
          )}
        </div>

        {/* Add trigger form */}
        {showForm && (
          <div className="border-b border-zinc-800/60 p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Keyword
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LINK, FREE, INFO"
                    value={form.keyword}
                    onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Match Type
                  </label>
                  <select
                    value={form.match_type}
                    onChange={e => setForm(f => ({ ...f, match_type: e.target.value as typeof form.match_type }))}
                    className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                  >
                    <option value="contains">Comment contains keyword</option>
                    <option value="exact">Comment is exactly keyword</option>
                    <option value="starts_with">Comment starts with keyword</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Comment Reply <span className="text-zinc-600">({form.comment_reply.length}/2200)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Hey! I just sent you a DM with the link 👋"
                  value={form.comment_reply}
                  onChange={e => setForm(f => ({ ...f, comment_reply: e.target.value }))}
                  maxLength={2200}
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  DM Message <span className="text-zinc-600">({form.dm_message.length}/1000)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Hey! Here's the link you asked for: cele.bio/yourname 🔥"
                  value={form.dm_message}
                  onChange={e => setForm(f => ({ ...f, dm_message: e.target.value }))}
                  maxLength={1000}
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveTrigger}
                  disabled={saving || !form.keyword || !form.comment_reply || !form.dm_message}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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

        {/* Triggers list */}
        {triggers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60">
              <Zap className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No triggers yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              {connection
                ? 'Add your first keyword trigger above'
                : 'Connect your Instagram account to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {triggers.map(trigger => (
              <div key={trigger.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-zinc-800/60 px-2.5 py-1">
                      <span className="font-mono text-sm font-semibold text-zinc-200">
                        {trigger.keyword}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {MATCH_LABELS[trigger.match_type]}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      trigger.is_active
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {trigger.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleTrigger(trigger)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                      title={trigger.is_active ? 'Pause' : 'Activate'}
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
                      {expandedId === trigger.id
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                      }
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
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-zinc-800/40 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-zinc-400">Comment Reply</span>
                      </div>
                      <p className="text-sm text-zinc-300">{trigger.comment_reply}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/40 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-pink-400" />
                        <span className="text-xs font-medium text-zinc-400">DM Message</span>
                      </div>
                      <p className="text-sm text-zinc-300">{trigger.dm_message}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DM permission note */}
      {connection && (
        <div className="mt-4 rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs text-zinc-500">
              <strong className="text-zinc-400">DM Note:</strong> Instagram allows automated DMs to users who have commented within a 24-hour window. The{' '}
              <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">instagram_manage_messages</code>{' '}
              permission requires Meta App Review before it goes live in production.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

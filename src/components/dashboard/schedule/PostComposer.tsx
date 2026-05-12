'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { uploadFile, validateFile, FILE_TYPES } from '@/lib/utils/uploadFile';
import { Loader2, ImagePlus, X, Calendar, Sparkles } from 'lucide-react';

const PLATFORM_OPTIONS: Array<{ id: PlatformId; label: string }> = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'twitter',   label: 'X' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'threads',   label: 'Threads' },
  { id: 'facebook',  label: 'Facebook' },
];

type PlatformId =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'threads'
  | 'facebook';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface PromotableProduct {
  id: string;
  title: string;
}

export interface PostComposerInitial {
  caption?: string;
  media?: MediaItem[];
  promotedProductId?: string;
  utmCampaign?: string;
}

interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  connectedPlatforms: Set<PlatformId>;
  products: PromotableProduct[];
  initial?: PostComposerInitial;
}

export function PostComposer({
  isOpen,
  onClose,
  onCreated,
  connectedPlatforms,
  products,
  initial,
}: PostComposerProps) {
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformId>>(new Set());
  const [scheduledFor, setScheduledFor] = useState<string>(() => defaultLocalDateTime());
  const [promotedProductId, setPromotedProductId] = useState<string>('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed when the modal opens with new initial values (e.g. "Promote
  // product X" → "Promote product Y"). Resetting on close would race with the
  // closing animation, so we re-seed on each open instead.
  useEffect(() => {
    if (isOpen) {
      setCaption(initial?.caption ?? '');
      setMedia(initial?.media ?? []);
      setSelectedPlatforms(new Set());
      setScheduledFor(defaultLocalDateTime());
      setPromotedProductId(initial?.promotedProductId ?? '');
      setUtmCampaign(initial?.utmCampaign ?? '');
      setError(null);
    }
  }, [isOpen, initial]);

  function togglePlatform(id: PlatformId) {
    if (!connectedPlatforms.has(id)) return;
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleFile(file: File) {
    setError(null);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) {
      setError('Only images and videos are supported.');
      return;
    }

    const validation = validateFile(file, {
      maxSize: isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
      allowedTypes: isVideo
        ? ['video/mp4', 'video/quicktime', 'video/webm']
        : FILE_TYPES.images,
    });
    if (!validation.valid) {
      setError(validation.error ?? 'File rejected.');
      return;
    }

    setUploading(true);
    try {
      const { publicUrl } = await uploadFile('product-covers', file, { folder: 'social-posts' });
      if (!publicUrl) throw new Error('Upload did not return a public URL');
      setMedia([{ url: publicUrl, type: isVideo ? 'video' : 'image' }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setError(null);

    if (selectedPlatforms.size === 0) {
      setError('Pick at least one platform.');
      return;
    }
    if (!caption.trim() && media.length === 0) {
      setError('Add a caption or media.');
      return;
    }
    const scheduledISO = new Date(scheduledFor).toISOString();
    if (new Date(scheduledISO).getTime() < Date.now() + 60_000) {
      setError('Scheduled time must be at least a minute in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          media,
          platforms: Array.from(selectedPlatforms),
          scheduled_for: scheduledISO,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          platform_overrides: {},
          promoted_product_id: promotedProductId || null,
          utm_campaign: utmCampaign.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Failed to schedule post.');
        return;
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule post.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New scheduled post" size="lg">
      <div className="space-y-5">
        {/* Caption */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's the post about?"
            rows={4}
            maxLength={5000}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <div className="mt-1 flex justify-between text-[11px] text-zinc-600">
            <span>Any cele.bio link gets UTM-tagged per platform automatically.</span>
            <span>{caption.length}/5000</span>
          </div>
        </div>

        {/* Media */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Media</label>
          {media.length === 0 ? (
            <label
              className={
                'flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition ' +
                (uploading
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40')
              }
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              ) : (
                <ImagePlus className="h-5 w-5 text-zinc-500" />
              )}
              <span className="text-xs text-zinc-500">
                {uploading ? 'Uploading…' : 'Click to upload image or video'}
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                disabled={uploading}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>
          ) : (
            <div className="relative inline-block">
              {media[0].type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media[0].url} alt="" className="h-32 w-32 rounded-lg object-cover" />
              ) : (
                <video src={media[0].url} className="h-32 w-32 rounded-lg object-cover" muted />
              )}
              <button
                onClick={() => setMedia([])}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 ring-2 ring-zinc-950 hover:bg-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Platforms */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Post to</label>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORM_OPTIONS.map((p) => {
              const isConnected = connectedPlatforms.has(p.id);
              const isSelected = selectedPlatforms.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  disabled={!isConnected}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                    (!isConnected
                      ? 'cursor-not-allowed border border-zinc-800 bg-zinc-900/50 text-zinc-600'
                      : isSelected
                      ? 'border border-indigo-500 bg-indigo-500/15 text-indigo-300'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600')
                  }
                  title={!isConnected ? 'Connect this account first' : undefined}
                >
                  {p.label}
                  {!isConnected && <span className="ml-1 opacity-60">·</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule + product row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              <Calendar className="mr-1 inline h-3 w-3" /> When
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              min={defaultLocalDateTime()}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              <Sparkles className="mr-1 inline h-3 w-3" /> Promote product (optional)
            </label>
            <select
              value={promotedProductId}
              onChange={(e) => setPromotedProductId(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">— None —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* UTM */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            UTM campaign (optional)
          </label>
          <input
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            placeholder="e.g. launch-week-1"
            maxLength={120}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule post
          </button>
        </div>
      </div>
    </Modal>
  );
}

function defaultLocalDateTime(): string {
  // 1 hour from now, formatted for <input type="datetime-local">
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

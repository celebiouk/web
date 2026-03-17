'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, Button, Input, Textarea, UpgradePrompt } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';
import {
  ArrowLeft,
  Upload,
  X,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'tech', label: 'Technology' },
  { value: 'creative', label: 'Creative' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export default function NewCoursePage() {
  const router = useRouter();
  const { allowed: canAccessCourses } = useFeatureGate('courses');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [difficulty, setDifficulty] = useState('beginner');
  const [priceDollars, setPriceDollars] = useState('');
  const [promoVideoUrl, setPromoVideoUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canAccessCourses) {
    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <UpgradePrompt feature="courses" />
      </div>
    );
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('course-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('bucket')) {
          throw new Error('Course storage is not set up yet. Please run the latest Supabase migrations and try again.');
        }

        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-covers')
        .getPublicUrl(filePath);

      setCoverImage(publicUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const price = parseFloat(priceDollars);
    if (priceDollars && (isNaN(price) || price < 1)) {
      setError('Price must be at least $1');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = slugify(title) + '-' + Date.now().toString(36);
      const priceCents = priceDollars ? Math.round(price * 100) : 0;

      const { data: course, error: insertError } = await (supabase.from('courses') as any)
        .insert({
          creator_id: user.id,
          title: title.trim(),
          slug,
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          cover_image_url: coverImage,
          promo_video_url: promoVideoUrl.trim() || null,
          category,
          difficulty,
          price_cents: priceCents,
          status: 'draft',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create a default first section
      if (course) {
        await (supabase.from('course_sections') as any).insert({
          course_id: course.id,
          title: 'Getting Started',
          position: 0,
        });
      }

      router.push(`/dashboard/courses/${course.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Course</h1>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 p-6">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Title *
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master Social Media Marketing"
                  maxLength={120}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtitle
                </label>
                <Input
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="A short tagline for your sales page"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Description
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What will students learn? Why should they enroll?"
                  rows={6}
                />
              </div>

              {/* Category + Difficulty */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceDollars}
                    onChange={e => setPriceDollars(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Minimum $1 for paid courses. Leave empty for free.</p>
              </div>

              {/* Promo Video */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Promo Video URL (optional)
                </label>
                <Input
                  value={promoVideoUrl}
                  onChange={e => setPromoVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <p className="mt-1 text-xs text-gray-400">YouTube or Vimeo embed for your sales page preview</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardContent className="p-6">
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Image
              </label>
              {coverImage ? (
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <Image src={coverImage} alt="Cover" fill className="object-cover" />
                  <button
                    onClick={() => setCoverImage(null)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500/50">
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {uploading ? 'Uploading...' : 'Upload cover (16:9)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Create Button */}
          <Button
            className="w-full py-3"
            onClick={handleCreate}
            disabled={!title.trim() || saving}
            isLoading={saving}
          >
            Create Course & Add Lessons
          </Button>
        </div>
      </div>
    </div>
  );
}

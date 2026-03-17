'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Modal, Button, Input, Textarea, Avatar, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { uploadFile, validateFile, FILE_TYPES } from '@/lib/utils/uploadFile';
import { Camera, Upload, X, ImageIcon } from 'lucide-react';
import type { Profile } from '@/types/supabase';

type PageBackgroundType = 'none' | 'color' | 'gradient' | 'image';

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #EEF2FF 0%, #FDF2F8 100%)',
  'linear-gradient(135deg, #ECFEFF 0%, #F0FDF4 100%)',
  'linear-gradient(135deg, #FFF7ED 0%, #FEF2F2 100%)',
  'linear-gradient(135deg, #111827 0%, #374151 100%)',
];

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export function ProfileEditModal({ isOpen, onClose, profile }: ProfileEditModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(profile.testimonials_enabled ?? false);
  const [showAvatarOnBanner, setShowAvatarOnBanner] = useState((profile as any).show_avatar_on_banner ?? true);
  const [pageBackgroundType, setPageBackgroundType] = useState<PageBackgroundType>(((profile as any).page_background_type as PageBackgroundType) || 'none');
  const [pageBackgroundValue, setPageBackgroundValue] = useState<string | null>((profile as any).page_background_value || null);

  // Image state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(
    ((profile as any).page_background_type as PageBackgroundType) === 'image' ? ((profile as any).page_background_value as string | null) : null
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB for banner
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }

  function removeBanner() {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  }

  function handleBackgroundImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: FILE_TYPES.images,
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setBackgroundImageFile(file);
    setBackgroundImagePreview(objectUrl);
    setPageBackgroundType('image');
    setPageBackgroundValue(objectUrl);
    setError(null);
  }

  function setBackgroundType(type: PageBackgroundType) {
    setPageBackgroundType(type);
    if (type === 'none') {
      setPageBackgroundValue(null);
      setBackgroundImageFile(null);
      setBackgroundImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      let avatarUrl = avatarPreview;
      let bannerUrl = bannerPreview;
      let backgroundValue = pageBackgroundType === 'none' ? null : pageBackgroundValue;

      // Upload new avatar if selected
      if (avatarFile) {
        const result = await uploadFile('avatars', avatarFile, {
          folder: profile.id,
        });
        avatarUrl = result.publicUrl || null;
      }

      // Upload new banner if selected
      if (bannerFile) {
        const result = await uploadFile('banners', bannerFile, {
          folder: profile.id,
        });
        bannerUrl = result.publicUrl || null;
      }

      if (pageBackgroundType === 'image' && backgroundImageFile) {
        const result = await uploadFile('banners', backgroundImageFile, {
          folder: `${profile.id}/page-backgrounds`,
        });
        backgroundValue = result.publicUrl || null;
      }

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          testimonials_enabled: testimonialsEnabled,
          show_avatar_on_banner: showAvatarOnBanner,
          page_background_type: pageBackgroundType,
          page_background_value: backgroundValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      router.refresh();
      onClose();
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Banner Image */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Banner Image
          </label>
          <div className="relative">
            <div
              onClick={() => bannerInputRef.current?.click()}
              className={`relative h-32 w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                bannerPreview
                  ? 'border-transparent'
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }`}
            >
              {bannerPreview ? (
                <>
                  <Image
                    src={bannerPreview}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="mb-2 h-8 w-8" />
                  <span className="text-sm">Click to upload banner</span>
                  <span className="text-xs text-gray-400">16:9 recommended (1920 × 1080)</span>
                </div>
              )}
            </div>
            {bannerPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBanner();
                }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerSelect}
            className="hidden"
          />
        </div>

        {/* Page Background */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Page Background
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Set the background behind your page content.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['none', 'color', 'gradient', 'image'] as PageBackgroundType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBackgroundType(type)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  pageBackgroundType === type
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {pageBackgroundType === 'color' ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pageBackgroundValue?.startsWith('#') ? pageBackgroundValue : '#ffffff'}
                onChange={(e) => setPageBackgroundValue(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-transparent p-1 dark:border-gray-700"
              />
              <Input
                value={pageBackgroundValue || '#ffffff'}
                onChange={(e) => setPageBackgroundValue(e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          ) : null}

          {pageBackgroundType === 'gradient' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {GRADIENT_PRESETS.map((gradient) => (
                  <button
                    key={gradient}
                    type="button"
                    onClick={() => setPageBackgroundValue(gradient)}
                    className={`h-10 rounded-lg border ${pageBackgroundValue === gradient ? 'border-brand-500' : 'border-gray-200 dark:border-gray-700'}`}
                    style={{ background: gradient }}
                  />
                ))}
              </div>
              <Input
                value={pageBackgroundValue || ''}
                onChange={(e) => setPageBackgroundValue(e.target.value)}
                placeholder="linear-gradient(135deg, #fff 0%, #f3f4f6 100%)"
              />
            </div>
          ) : null}

          {pageBackgroundType === 'image' ? (
            <label className="group relative block cursor-pointer">
              <div className={`relative h-24 w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                backgroundImagePreview
                  ? 'border-transparent'
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }`}>
                {backgroundImagePreview ? (
                  <>
                    <Image src={backgroundImagePreview} alt="Page background preview" fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="mb-2 h-8 w-8" />
                    <span className="text-sm">Click to upload background image</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleBackgroundImageSelect} className="hidden" />
            </label>
          ) : null}
        </div>

        {/* Avatar */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full"
            >
              {avatarPreview ? (
                <>
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Avatar name={fullName || 'User'} size="xl" />
                </div>
              )}
            </div>
            {avatarPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAvatar();
                }}
                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Click the avatar to upload a new photo. Square images work best.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-2"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload Photo
            </Button>
          </div>
        </div>

        {/* Username (read-only) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <Input
            value={`@${profile.username || ''}`}
            disabled
            className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Username cannot be changed after signup.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Display Name
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bio
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself..."
            rows={3}
          />
        </div>

        {/* Website */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Website
          </label>
          <Input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>

        {/* Testimonials Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Show Testimonials</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Display testimonials section on your landing page
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTestimonialsEnabled(!testimonialsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              testimonialsEnabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                testimonialsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Avatar on Banner Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Avatar on Header Banner</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show avatar at the bottom-center of your page header
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAvatarOnBanner(!showAvatarOnBanner)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showAvatarOnBanner ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showAvatarOnBanner ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={isSaving}>
            {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

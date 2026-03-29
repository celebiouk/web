'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Avatar } from '@/components/ui';
import { useUsernameValidation } from '@/hooks/use-username-validation';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/supabase';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface ProfileSetupFormProps {
  userId: string;
  initialProfile: {
    fullName: string;
    username: string;
    bio: string;
    avatarUrl: string | null;
  };
}

/**
 * Profile setup form for onboarding
 */
export function ProfileSetupForm({ userId, initialProfile }: ProfileSetupFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [username, setUsername] = useState(initialProfile.username);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Username validation with debounce
  const usernameValidation = useUsernameValidation(username, userId);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setAvatarFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      setAvatarLoadFailed(false);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    // Check username validation
    if (!usernameValidation.isValid) {
      setError(usernameValidation.error || 'Please enter a valid username');
      return;
    }

    setIsLoading(true);

    try {
      let finalAvatarUrl = avatarUrl && !avatarUrl.startsWith('blob:') ? avatarUrl : initialProfile.avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Continue without avatar - not a blocking error
        } else if (data) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('avatars').getPublicUrl(data.path);
          finalAvatarUrl = publicUrl;
        }
      }

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.toLowerCase().trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl && !finalAvatarUrl.startsWith('blob:') ? finalAvatarUrl : null,
          onboarding_completed: true,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError('Failed to save profile. Please try again.');
        return;
      }

      // Navigate to success page
      router.push('/onboarding/success');
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate username preview
  const usernamePreview = username
    ? `cele.bio/${username.toLowerCase()}`
    : 'cele.bio/yourname';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="group relative"
        >
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-gray-100 transition-all group-hover:ring-brand-100 dark:ring-gray-800 dark:group-hover:ring-brand-900">
            {avatarUrl && !avatarLoadFailed ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <Avatar name={fullName || 'User'} size="xl" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Click to upload photo
        </p>
      </div>

      {/* Full Name */}
      <Input
        label="Full Name"
        placeholder="Your name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoComplete="name"
      />

      {/* Username */}
      <div>
        <Input
          label="Username"
          placeholder="yourname"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          required
          error={
            username && !usernameValidation.isChecking
              ? usernameValidation.error ?? undefined
              : undefined
          }
          rightIcon={
            usernameValidation.isChecking ? (
              <svg
                className="h-5 w-5 animate-spin text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : usernameValidation.isValid ? (
              <svg
                className="h-5 w-5 text-success-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : null
          }
        />
        {/* Username Preview */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Your page:
          </span>
          <span
            className={cn(
              'rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium dark:bg-gray-800',
              usernameValidation.isValid
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {usernamePreview}
          </span>
        </div>
      </div>

      {/* Bio */}
      <Textarea
        label="Bio"
        placeholder="Tell your audience who you are and what you do..."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        maxLength={160}
        charCount
        hint="A short bio that appears on your page"
      />

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={isLoading}
        disabled={!fullName || !username || !usernameValidation.isValid}
      >
        Launch My Page 🚀
      </Button>

      {/* Back Link */}
      <p className="text-center">
        <button
          type="button"
          onClick={() => router.push('/onboarding/pick-template')}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← Back to templates
        </button>
      </p>
    </form>
  );
}

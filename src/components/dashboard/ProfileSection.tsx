'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, Button, Avatar } from '@/components/ui';
import { ProfileEditModal } from '@/components/dashboard/ProfileEditModal';
import type { Profile } from '@/types/supabase';

interface ProfileSectionProps {
  profile: Profile;
  email?: string;
}

export function ProfileSection({ profile, email }: ProfileSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent>
          {/* Banner preview */}
          {profile.banner_url && (
            <div className="relative -mx-6 -mt-6 mb-6 h-24 overflow-hidden">
              <Image
                src={profile.banner_url}
                alt="Profile banner"
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name || 'User'}
              size="lg"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile.full_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{profile.username}
              </p>
              {email && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {email}
                </p>
              )}
            </div>
          </div>
          {profile.bio && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {profile.bio}
            </p>
          )}
          
          {/* Testimonials status */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Testimonials:</span>
            <span className={profile.testimonials_enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
              {profile.testimonials_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </CardContent>
      </Card>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
      />
    </>
  );
}

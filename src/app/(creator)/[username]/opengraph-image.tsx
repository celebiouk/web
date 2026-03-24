import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/supabase';

export const runtime = 'edge';
export const alt = 'Creator page on Cele.bio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic OG image for each creator's public page.
 * Shows their avatar, name, and bio in a branded card.
 */
export default async function CreatorOGImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('username', username.toLowerCase())
    .single();

  const profile = data as Pick<Profile, 'full_name' | 'bio' | 'avatar_url'> | null;

  const name = profile?.full_name || username;
  const bio = profile?.bio || `Check out ${name}'s page on Cele.bio`;
  const avatarUrl =
    typeof profile?.avatar_url === 'string' && profile.avatar_url.startsWith('blob:')
      ? null
      : profile?.avatar_url;

  // Truncate bio to ~120 chars for readability
  const truncatedBio = bio.length > 120 ? bio.slice(0, 117) + '...' : bio;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Decoration */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: '100%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -60,
            width: 350,
            height: 350,
            borderRadius: '100%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            width={120}
            height={120}
            style={{
              borderRadius: '100%',
              objectFit: 'cover',
              border: '4px solid rgba(99,102,241,0.4)',
              marginBottom: 24,
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '100%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 52,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 24,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {name}
        </div>

        {/* Bio */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          {truncatedBio}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
            cele
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1' }}>
            .bio
          </span>
          <span style={{ fontSize: 18, color: '#475569', marginLeft: 4 }}>
            /{username}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

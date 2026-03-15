'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { PageTheme, TemplateSlug } from '@/types/creator-page';
import type { Profile } from '@/types/supabase';

// Predefined color palettes
const COLOR_PALETTES = [
  { name: 'Ocean', primary: '#0D1B2A', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Forest', primary: '#064E3B', background: '#F0FDF4', text: '#1F2937' },
  { name: 'Sunset', primary: '#DC2626', background: '#FEF2F2', text: '#1F2937' },
  { name: 'Lavender', primary: '#7C3AED', background: '#F5F3FF', text: '#1F2937' },
  { name: 'Gold', primary: '#B8860B', background: '#FFFBEB', text: '#1F2937' },
  { name: 'Night', primary: '#8B5CF6', background: '#0F172A', text: '#F8FAFC' },
  { name: 'Coral', primary: '#E07A5F', background: '#FEF7F0', text: '#1F2937' },
  { name: 'Teal', primary: '#0891B2', background: '#ECFEFF', text: '#1F2937' },
];

// Font families
const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', preview: 'Clean & Modern' },
  { value: 'playfair', label: 'Playfair Display', preview: 'Editorial & Elegant' },
  { value: 'source-sans', label: 'Source Sans', preview: 'Professional & Clear' },
  { value: 'cormorant', label: 'Cormorant', preview: 'Luxury & Refined' },
  { value: 'plus-jakarta', label: 'Plus Jakarta Sans', preview: 'Friendly & Fresh' },
];

/**
 * Theme Customizer Page
 * Basic customization: colors, fonts, dark mode toggle
 */
export default function ThemeCustomizerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<PageTheme>({
    primary_color: '#0D1B2A',
    background_color: '#FFFFFF',
    text_color: '#1F2937',
    font_family: 'inter',
    dark_mode: false,
  });

  // Fetch current theme settings
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        const profileData = data as Profile & { page_theme?: PageTheme };
        setProfile(profileData);
        
        if (profileData.page_theme) {
          setTheme(profileData.page_theme);
        }
      }
      
      setLoading(false);
    }

    fetchProfile();
  }, [router]);

  // Handle palette selection
  const handlePaletteSelect = useCallback((palette: typeof COLOR_PALETTES[0]) => {
    setTheme(prev => ({
      ...prev,
      primary_color: palette.primary,
      background_color: palette.background,
      text_color: palette.text,
    }));
  }, []);

  // Handle custom color change
  const handleColorChange = useCallback((field: keyof PageTheme, value: string) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle font change
  const handleFontChange = useCallback((fontFamily: string) => {
    setTheme(prev => ({ ...prev, font_family: fontFamily }));
  }, []);

  // Handle dark mode toggle
  const handleDarkModeToggle = useCallback(() => {
    setTheme(prev => ({ ...prev, dark_mode: !prev.dark_mode }));
  }, []);

  // Save theme settings
  const handleSave = useCallback(async () => {
    if (!profile) return;
    
    setSaving(true);
    const supabase = createClient();

    try {
      await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> } } })
        .from('profiles')
        .update({ page_theme: theme })
        .eq('id', profile.id);

      // Navigate to preview to see changes
      router.push('/dashboard/preview');
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setSaving(false);
    }
  }, [profile, theme, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customize Theme
          </h1>
          <p className="text-sm text-gray-500">
            Personalize your page colors and fonts
          </p>
        </div>
        <Link
          href="/dashboard/preview"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          Back to Preview
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        {/* Settings Panel */}
        <div className="space-y-8">
          {/* Color Palettes */}
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Color Palettes
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Choose a preset palette or customize below
            </p>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => handlePaletteSelect(palette)}
                  className={`group relative overflow-hidden rounded-xl p-3 transition-all ${
                    theme.primary_color === palette.primary
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'hover:ring-2 hover:ring-gray-200'
                  }`}
                  style={{ backgroundColor: palette.background }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: palette.text }}
                    >
                      {palette.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Custom Colors */}
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Custom Colors
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Primary Color */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <input
                    type="text"
                    value={theme.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Background
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <input
                    type="text"
                    value={theme.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <input
                    type="text"
                    value={theme.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Font Family */}
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Font Family
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => handleFontChange(font.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    theme.font_family === font.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {font.label}
                  </p>
                  <p className="text-sm text-gray-500">{font.preview}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Dark Mode Toggle */}
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dark Mode
                </h2>
                <p className="text-sm text-gray-500">
                  Enable dark theme for your page
                </p>
              </div>
              <button
                onClick={handleDarkModeToggle}
                className={`relative h-7 w-14 rounded-full transition-colors ${
                  theme.dark_mode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    theme.dark_mode ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        {/* Live Preview Mini */}
        <div className="sticky top-6">
          <section className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Live Preview
            </h2>
            
            {/* Mini preview card */}
            <div
              className="overflow-hidden rounded-xl p-6"
              style={{
                backgroundColor: theme.background_color,
                color: theme.text_color,
              }}
            >
              {/* Fake profile header */}
              <div className="mb-4 text-center">
                <div
                  className="mx-auto mb-3 h-16 w-16 rounded-full"
                  style={{ backgroundColor: theme.primary_color }}
                />
                <h3 className="text-lg font-bold">Your Name</h3>
                <p className="text-sm opacity-70">Creator Bio</p>
              </div>

              {/* Fake CTA button */}
              <button
                className="mb-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.primary_color }}
              >
                Get My Product
              </button>

              {/* Fake product card */}
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${theme.primary_color}10` }}
              >
                <div className="mb-2 h-20 rounded bg-gray-200" />
                <p className="text-sm font-medium">Product Title</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: theme.primary_color }}
                >
                  $47
                </p>
              </div>
            </div>

            {/* Font preview */}
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Font Preview
              </p>
              <p className="text-gray-900 dark:text-white">
                {FONT_OPTIONS.find(f => f.value === theme.font_family)?.label || 'Inter'}
              </p>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Full preview link */}
          <Link
            href="/dashboard/preview"
            className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-primary"
          >
            Open Full Preview →
          </Link>
        </div>
      </div>
    </div>
  );
}

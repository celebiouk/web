// CeleStudio Design Systems
// Each system controls typography, color, spacing, decoration — applied globally to an ebook.
// Adding a new system = add an entry here and a renderer mapping in BlockRenderer.

export type DesignSystemSlug =
  | 'minimal-editorial'
  | 'luxury-black-gold'
  | 'modern-startup'
  | 'wellness-soft'
  | 'futuristic-ai'
  | 'corporate-clean';

export interface DesignTokens {
  // Surfaces
  page: string;        // Page background
  surface: string;     // Card/section background
  surfaceMuted: string;
  border: string;
  divider: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;

  // Brand / accent
  accent: string;
  accentMuted: string;
  accentText: string;  // Text color when on accent bg

  // Decorative
  quoteBg: string;
  calloutBg: string;
  statBg: string;
}

export interface DesignSystem {
  slug: DesignSystemSlug;
  name: string;
  tagline: string;
  description: string;
  fontHeading: string;          // CSS font stack
  fontBody: string;
  fontMono?: string;
  headingScale: number;         // Multiplier for heading sizes (1 = baseline)
  letterSpacingHeading: string; // CSS letter-spacing
  letterSpacingBody: string;
  lineHeightBody: number;
  // Layout
  pageMaxWidth: string;
  sectionSpacing: string;       // Gap between sections
  blockRadius: string;          // Border radius for cards
  // Page composition
  hero: 'cinematic' | 'editorial' | 'centered' | 'overlay' | 'split';
  divider: 'rule' | 'ornament' | 'dot' | 'gradient' | 'none';
  // Color tokens
  light: DesignTokens;
  dark: DesignTokens;
  // Preview chip colors (for picker cards)
  previewGradient: string;
}

export const DESIGN_SYSTEMS: Record<DesignSystemSlug, DesignSystem> = {
  'minimal-editorial': {
    slug: 'minimal-editorial',
    name: 'Minimal Editorial',
    tagline: 'Modern magazine aesthetic',
    description: 'Spacious typography-first layouts inspired by The New York Times Magazine and Kinfolk.',
    fontHeading: '"Fraunces", "Playfair Display", Georgia, serif',
    fontBody: '"Inter", system-ui, -apple-system, sans-serif',
    headingScale: 1.1,
    letterSpacingHeading: '-0.02em',
    letterSpacingBody: '0',
    lineHeightBody: 1.7,
    pageMaxWidth: '720px',
    sectionSpacing: '5rem',
    blockRadius: '0px',
    hero: 'editorial',
    divider: 'rule',
    light: {
      page: '#FAFAF7',
      surface: '#FFFFFF',
      surfaceMuted: '#F4F3EE',
      border: '#E8E6DF',
      divider: '#1A1A1A',
      text: '#1A1A1A',
      textMuted: '#5C5C5C',
      textSubtle: '#8A8A8A',
      accent: '#1A1A1A',
      accentMuted: '#F4F3EE',
      accentText: '#FAFAF7',
      quoteBg: 'transparent',
      calloutBg: '#F4F3EE',
      statBg: '#FFFFFF',
    },
    dark: {
      page: '#0F0F0E',
      surface: '#1A1A18',
      surfaceMuted: '#252522',
      border: '#2C2C29',
      divider: '#FAFAF7',
      text: '#FAFAF7',
      textMuted: '#B8B6AE',
      textSubtle: '#8A8884',
      accent: '#FAFAF7',
      accentMuted: '#252522',
      accentText: '#0F0F0E',
      quoteBg: 'transparent',
      calloutBg: '#1A1A18',
      statBg: '#1A1A18',
    },
    previewGradient: 'linear-gradient(135deg, #FAFAF7 0%, #E8E6DF 100%)',
  },

  'luxury-black-gold': {
    slug: 'luxury-black-gold',
    name: 'Luxury Black & Gold',
    tagline: 'Cinematic and elegant',
    description: 'Deep black canvases with warm gold accents. Premium, dramatic, expensive-feeling.',
    fontHeading: '"Cormorant Garamond", "Didot", Georgia, serif',
    fontBody: '"Inter", system-ui, sans-serif',
    headingScale: 1.25,
    letterSpacingHeading: '0.01em',
    letterSpacingBody: '0.005em',
    lineHeightBody: 1.75,
    pageMaxWidth: '760px',
    sectionSpacing: '6rem',
    blockRadius: '2px',
    hero: 'cinematic',
    divider: 'ornament',
    light: {
      page: '#0A0908',
      surface: '#141210',
      surfaceMuted: '#1F1B16',
      border: '#3A3128',
      divider: '#C9A961',
      text: '#F5EBD7',
      textMuted: '#B89D6E',
      textSubtle: '#8A7556',
      accent: '#C9A961',
      accentMuted: '#1F1B16',
      accentText: '#0A0908',
      quoteBg: '#141210',
      calloutBg: '#1F1B16',
      statBg: '#141210',
    },
    dark: {
      page: '#000000',
      surface: '#0A0908',
      surfaceMuted: '#141210',
      border: '#3A3128',
      divider: '#C9A961',
      text: '#F5EBD7',
      textMuted: '#B89D6E',
      textSubtle: '#8A7556',
      accent: '#D4B97A',
      accentMuted: '#141210',
      accentText: '#000000',
      quoteBg: '#0A0908',
      calloutBg: '#141210',
      statBg: '#0A0908',
    },
    previewGradient: 'linear-gradient(135deg, #0A0908 0%, #C9A961 200%)',
  },

  'modern-startup': {
    slug: 'modern-startup',
    name: 'Modern Startup',
    tagline: 'SaaS-inspired and sharp',
    description: 'Clean SaaS-style layouts with bold gradients and contemporary typography.',
    fontHeading: '"Geist", "Inter", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    headingScale: 1.05,
    letterSpacingHeading: '-0.025em',
    letterSpacingBody: '-0.005em',
    lineHeightBody: 1.65,
    pageMaxWidth: '740px',
    sectionSpacing: '4.5rem',
    blockRadius: '12px',
    hero: 'split',
    divider: 'gradient',
    light: {
      page: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceMuted: '#F8FAFC',
      border: '#E2E8F0',
      divider: '#6366F1',
      text: '#0F172A',
      textMuted: '#475569',
      textSubtle: '#94A3B8',
      accent: '#6366F1',
      accentMuted: '#EEF2FF',
      accentText: '#FFFFFF',
      quoteBg: '#F8FAFC',
      calloutBg: '#EEF2FF',
      statBg: '#F8FAFC',
    },
    dark: {
      page: '#0B0E14',
      surface: '#11141B',
      surfaceMuted: '#171B24',
      border: '#1F2532',
      divider: '#818CF8',
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      textSubtle: '#64748B',
      accent: '#818CF8',
      accentMuted: '#1E1B4B',
      accentText: '#0B0E14',
      quoteBg: '#11141B',
      calloutBg: '#1E1B4B',
      statBg: '#11141B',
    },
    previewGradient: 'linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)',
  },

  'wellness-soft': {
    slug: 'wellness-soft',
    name: 'Wellness Soft',
    tagline: 'Calming and organic',
    description: 'Warm neutrals, gentle curves, breathable layouts for coaches and wellness creators.',
    fontHeading: '"DM Serif Display", "Playfair Display", serif',
    fontBody: '"Nunito", "Inter", system-ui, sans-serif',
    headingScale: 1.05,
    letterSpacingHeading: '-0.01em',
    letterSpacingBody: '0',
    lineHeightBody: 1.75,
    pageMaxWidth: '700px',
    sectionSpacing: '4.5rem',
    blockRadius: '24px',
    hero: 'centered',
    divider: 'dot',
    light: {
      page: '#FBF8F4',
      surface: '#FFFFFF',
      surfaceMuted: '#F4ECE0',
      border: '#E8DCC8',
      divider: '#C19A75',
      text: '#3A2E22',
      textMuted: '#7A6553',
      textSubtle: '#A89685',
      accent: '#C19A75',
      accentMuted: '#F4ECE0',
      accentText: '#FBF8F4',
      quoteBg: '#F4ECE0',
      calloutBg: '#FAF1E2',
      statBg: '#FFFFFF',
    },
    dark: {
      page: '#1A1612',
      surface: '#221E18',
      surfaceMuted: '#2C2620',
      border: '#3A3128',
      divider: '#D4AC85',
      text: '#FBF8F4',
      textMuted: '#C7B7A6',
      textSubtle: '#8A7A6A',
      accent: '#D4AC85',
      accentMuted: '#2C2620',
      accentText: '#1A1612',
      quoteBg: '#221E18',
      calloutBg: '#2C2620',
      statBg: '#221E18',
    },
    previewGradient: 'linear-gradient(135deg, #FBF8F4 0%, #C19A75 130%)',
  },

  'futuristic-ai': {
    slug: 'futuristic-ai',
    name: 'Futuristic AI',
    tagline: 'Glowing and sleek',
    description: 'Dark canvases with neon accents and precise typography. Built for tech-forward content.',
    fontHeading: '"Space Grotesk", "Inter", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", "Fira Code", monospace',
    headingScale: 1.0,
    letterSpacingHeading: '-0.03em',
    letterSpacingBody: '-0.005em',
    lineHeightBody: 1.65,
    pageMaxWidth: '760px',
    sectionSpacing: '5rem',
    blockRadius: '8px',
    hero: 'overlay',
    divider: 'gradient',
    light: {
      page: '#FFFFFF',
      surface: '#FAFAFA',
      surfaceMuted: '#F4F4F5',
      border: '#E4E4E7',
      divider: '#06B6D4',
      text: '#0A0A0A',
      textMuted: '#52525B',
      textSubtle: '#A1A1AA',
      accent: '#06B6D4',
      accentMuted: '#ECFEFF',
      accentText: '#FFFFFF',
      quoteBg: '#F4F4F5',
      calloutBg: '#ECFEFF',
      statBg: '#FAFAFA',
    },
    dark: {
      page: '#050507',
      surface: '#0A0A0F',
      surfaceMuted: '#10101A',
      border: '#1A1A26',
      divider: '#22D3EE',
      text: '#F5F5FA',
      textMuted: '#A1A1AA',
      textSubtle: '#52525B',
      accent: '#22D3EE',
      accentMuted: '#0E2C36',
      accentText: '#050507',
      quoteBg: '#0A0A0F',
      calloutBg: '#10101A',
      statBg: '#0A0A0F',
    },
    previewGradient: 'linear-gradient(135deg, #050507 0%, #22D3EE 200%)',
  },

  'corporate-clean': {
    slug: 'corporate-clean',
    name: 'Corporate Clean',
    tagline: 'Professional and trustworthy',
    description: 'Polished business-report aesthetic. Clear hierarchy, conservative colors, presentation-ready.',
    fontHeading: '"Source Serif Pro", "Georgia", serif',
    fontBody: '"Source Sans 3", "Inter", system-ui, sans-serif',
    headingScale: 1.0,
    letterSpacingHeading: '-0.015em',
    letterSpacingBody: '0',
    lineHeightBody: 1.7,
    pageMaxWidth: '720px',
    sectionSpacing: '4rem',
    blockRadius: '4px',
    hero: 'centered',
    divider: 'rule',
    light: {
      page: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceMuted: '#F8F9FB',
      border: '#D9DEE6',
      divider: '#1E40AF',
      text: '#0F172A',
      textMuted: '#475569',
      textSubtle: '#94A3B8',
      accent: '#1E40AF',
      accentMuted: '#EFF6FF',
      accentText: '#FFFFFF',
      quoteBg: '#F8F9FB',
      calloutBg: '#EFF6FF',
      statBg: '#F8F9FB',
    },
    dark: {
      page: '#0B0F1A',
      surface: '#101521',
      surfaceMuted: '#161D2C',
      border: '#1E2638',
      divider: '#3B82F6',
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      textSubtle: '#64748B',
      accent: '#3B82F6',
      accentMuted: '#172554',
      accentText: '#FFFFFF',
      quoteBg: '#101521',
      calloutBg: '#172554',
      statBg: '#101521',
    },
    previewGradient: 'linear-gradient(135deg, #1E40AF 0%, #0F172A 100%)',
  },
};

export const DESIGN_SYSTEM_LIST: DesignSystem[] = Object.values(DESIGN_SYSTEMS);

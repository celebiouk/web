/**
 * Theme Configuration - Premium Design System
 * Inspired by Linear, Vercel, and Stripe
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export const themes = {
  // Deep dark theme - Vercel/Linear inspired
  dark: {
    bg: {
      primary: '#0A0A0B',      // Deep black background
      secondary: '#111113',    // Elevated surface
      tertiary: '#18181B',     // Cards
      elevated: '#1F1F23',     // Hover states, modals
      hover: '#27272A',        // Interactive hover
    },
    border: {
      subtle: '#1F1F23',       // Subtle borders
      default: '#27272A',      // Default borders
      strong: '#3F3F46',       // Strong borders on focus
    },
    text: {
      primary: '#FAFAFA',      // Primary text
      secondary: '#A1A1AA',    // Secondary text
      tertiary: '#71717A',     // Muted text
      disabled: '#52525B',     // Disabled
    },
    accent: {
      primary: '#6366F1',      // Indigo - main accent
      primaryHover: '#818CF8', // Lighter on hover
      primaryMuted: 'rgba(99, 102, 241, 0.1)',  // Background tint
      primaryGlow: 'rgba(99, 102, 241, 0.25)', // Glow effect
    },
    success: {
      primary: '#10B981',
      muted: 'rgba(16, 185, 129, 0.1)',
    },
    warning: {
      primary: '#F59E0B',
      muted: 'rgba(245, 158, 11, 0.1)',
    },
    error: {
      primary: '#EF4444',
      muted: 'rgba(239, 68, 68, 0.1)',
    },
  },
  
  // Clean light theme - Apple/Linear inspired
  light: {
    bg: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F4F4F5',
      elevated: '#FFFFFF',
      hover: '#F4F4F5',
    },
    border: {
      subtle: '#E4E4E7',
      default: '#D4D4D8',
      strong: '#A1A1AA',
    },
    text: {
      primary: '#09090B',
      secondary: '#52525B',
      tertiary: '#71717A',
      disabled: '#A1A1AA',
    },
    accent: {
      primary: '#6366F1',
      primaryHover: '#4F46E5',
      primaryMuted: 'rgba(99, 102, 241, 0.08)',
      primaryGlow: 'rgba(99, 102, 241, 0.15)',
    },
    success: {
      primary: '#059669',
      muted: 'rgba(5, 150, 105, 0.08)',
    },
    warning: {
      primary: '#D97706',
      muted: 'rgba(217, 119, 6, 0.08)',
    },
    error: {
      primary: '#DC2626',
      muted: 'rgba(220, 38, 38, 0.08)',
    },
  },
} as const;

// Design tokens
export const tokens = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  transition: {
    fast: '100ms ease',
    default: '150ms ease',
    slow: '300ms ease',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    innerGlow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
  },
  typography: {
    fontFamily: {
      sans: '"Geist", "Inter", system-ui, -apple-system, sans-serif',
      mono: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.8125rem',  // 13px
      base: '0.875rem', // 14px
      md: '1rem',       // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
      '4xl': '2.5rem',  // 40px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },
} as const;

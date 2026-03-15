/**
 * Main type exports for the application
 */

export * from './supabase';

// User session with profile data
export interface UserSession {
  id: string;
  email: string;
  profile: import('./supabase').Profile | null;
}

// Onboarding state
export interface OnboardingState {
  step: 'pick-template' | 'setup-profile' | 'success';
  selectedTemplateId: string | null;
  profile: {
    fullName: string;
    username: string;
    bio: string;
    avatarUrl: string | null;
  };
}

// Username validation result
export interface UsernameValidation {
  isValid: boolean;
  isAvailable: boolean | null;
  isChecking: boolean;
  error: string | null;
}

// Dashboard navigation items
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiresPro?: boolean;
  badge?: string;
}

// Checklist item for onboarding completion
export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
  href?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

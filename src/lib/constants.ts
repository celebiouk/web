/**
 * Application constants and configuration
 */

// App metadata
export const APP_NAME = 'Cele.bio';
export const APP_DESCRIPTION = 'Turn your knowledge into beautiful digital products and monetize your audience in minutes.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio';

// Pricing tiers
export const PRICING = {
  FREE: {
    name: 'Free',
    price: 0,
    commission: 8, // 8% per sale
    features: [
      'Bio link storefront',
      'All 10 templates',
      'Sell digital products',
      '1:1 coaching sessions',
      'Up to 500 email subscribers',
      'Basic analytics',
    ],
    limitations: [
      'No courses',
      'No custom domain',
      'No unlimited email subscribers',
      '8% commission + gateway fees',
    ],
  },
  PRO_MONTHLY: {
    name: 'Pro Monthly',
    price: 1999, // $19.99 in cents
    commission: 0,
    features: [
      'Everything in Free',
      'Create & sell courses',
      'Unlimited email subscribers',
      'Advanced analytics',
      'Custom domain',
      'Bundle builder & upsells',
      '0% commission',
      'Priority support',
    ],
    limitations: [],
  },
  PRO_YEARLY: {
    name: 'Pro Yearly',
    price: 16790, // $167.90 in cents ($13.99/mo)
    commission: 0,
    monthlyEquivalent: 1399, // $13.99/mo
    discount: 30, // 30% off
    popular: true,
    features: [
      'Everything in Pro Monthly',
      'Save 30% vs monthly',
    ],
    limitations: [],
  },
} as const;

// Template categories
export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'creative', label: 'Creative' },
  { value: 'professional', label: 'Professional' },
] as const;

// Dashboard navigation
export const DASHBOARD_NAV = [
  { label: 'Home', href: '/dashboard', icon: 'home' },
  { label: 'Page Editor', href: '/dashboard/page-editor', icon: 'layout' },
  { label: 'Products', href: '/dashboard/products', icon: 'package' },
  { label: 'Testimonials', href: '/dashboard/testimonials', icon: 'message-square' },
  { label: 'Email', href: '/dashboard/email', icon: 'mail' },
  { label: 'Bookings', href: '/dashboard/bookings', icon: 'calendar' },
  { label: 'Courses', href: '/dashboard/courses', icon: 'graduation-cap', requiresPro: true },
  { label: 'Affiliates', href: '/dashboard/affiliates', icon: 'users', requiresPro: true },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'bar-chart' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'settings' },
] as const;

// Onboarding checklist
export const ONBOARDING_CHECKLIST = [
  { id: 'template', label: 'Choose a template', field: 'template_id' },
  { id: 'avatar', label: 'Upload profile photo', field: 'avatar_url' },
  { id: 'bio', label: 'Write your bio', field: 'bio' },
  { id: 'product', label: 'Add your first product', field: null },
] as const;

// Social links
export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: 'instagram' },
  { value: 'twitter', label: 'Twitter/X', icon: 'twitter' },
  { value: 'youtube', label: 'YouTube', icon: 'youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'music' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { value: 'website', label: 'Website', icon: 'globe' },
] as const;

// Product types
export const PRODUCT_TYPES = [
  { value: 'digital', label: 'Digital Download', description: 'PDFs, ebooks, templates, presets' },
  { value: 'coaching', label: '1:1 Coaching', description: 'Video calls, consultations' },
  { value: 'course', label: 'Online Course', description: 'Video lessons, modules (Pro only)' },
] as const;

// File upload limits
export const UPLOAD_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  PRODUCT_IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  DIGITAL_PRODUCT_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DIGITAL_TYPES: ['application/pdf', 'application/zip'],
} as const;

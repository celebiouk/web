# cele.bio — Creator Monetization Platform

## Project Overview
Cele.bio is a mobile-first creator monetization platform (Stan.store competitor). Creators get a beautiful storefront at cele.bio/username in under 5 minutes — pick a template, edit pre-filled content, connect Stripe, go live.

## Target Users
- Influencers & content creators
- Coaches & educators

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Payments**: Stripe Connect
- **Deployment**: Vercel

## Folder Structure
```
/app
  /dashboard
  /(auth)
    /login
    /signup
  /(onboarding)
    /pick-template
    /setup-profile
  /(creator)
    /[username]
/components
  /ui
  /templates
  /onboarding
  /dashboard
/lib
  /supabase
  /stripe
  /utils
  /hooks
/types
```

## Database Tables (Supabase)
- **profiles**: id, username, full_name, bio, avatar_url, subscription_tier, stripe_account_id, template_id, created_at
- **templates**: id, name, slug, category, preview_image_url, is_active
- **products**: id, creator_id, title, description, price, type (digital/course/coaching), is_published, created_at
- **subscriptions**: id, user_id, plan, status, stripe_subscription_id, current_period_end

## Pricing Tiers
- **Free**: Sell digital products + 1:1 coaching, 8% commission per sale + gateway fees, NO courses, max 500 email subscribers
- **Pro Monthly**: $19.99/mo, 0% commission, courses unlocked, unlimited email, custom domain, advanced analytics
- **Pro Yearly**: $167.90/yr (~$13.99/mo), same as Pro, 30% discount, marked "Most Popular"

## Key Features by Phase
- **Phase 1** ✅ Auth + onboarding + template picker
- **Phase 2** — Template engine + pre-filled content system (10 templates)
- **Phase 3** — Digital products + Stripe Connect
- **Phase 4** — 1:1 bookings
- **Phase 5** — Courses (Pro gated)
- **Phase 6** — Billing system (commission tracking, subscriptions)
- **Phase 7** — Analytics, email marketing, bundle builder

## Template System
10 world-class mobile-first templates, each pre-loaded with:
- Hero section (photo, bio, CTA)
- 2 placeholder digital products (ready to edit)
- 1 coaching/1:1 booking section
- Social links + email capture
- Testimonials section

### Template Categories
| Slug | Name | Best For |
|------|------|----------|
| minimal-clean | Minimal Clean | Coaches, consultants |
| bold-creator | Bold Creator | Influencers, personal brands |
| course-academy | Course Academy | Educators, course sellers |
| dark-premium | Dark Premium | Musicians, artists |
| warm-approachable | Warm & Approachable | Lifestyle, wellness coaches |
| corporate-pro | Corporate Pro | Business coaches, speakers |
| vibrant-social | Vibrant Social | Gen-Z creators, TikTokers |
| editorial | Editorial | Writers, newsletter creators |
| tech-vibe | Tech/SaaS Vibe | Dev educators, tech creators |
| luxury | Luxury | High-ticket coaches |

## Onboarding Flow
1. Sign up → /onboarding/pick-template
2. Pick template (10 cards, preview available)
3. Setup profile (name, username, bio, photo) — live cele.bio/username preview as they type
4. Success screen with confetti → Dashboard or View Page

## Feature Gating Rules
- Courses → Pro only (show lock icon for free users)
- Commission → 8% on free, 0% on Pro (Stripe Connect handles split)
- Custom domain → Pro only
- Email subscribers → 500 cap on free, unlimited on Pro

## Reusable Hook Pattern
Always use `useSubscription()` hook to check tier and gate features:
```typescript
const { tier, isPro } = useSubscription()
if (!isPro) // show upgrade prompt
```

## Design Principles
- Mobile-first in every component
- Premium feel — smooth transitions, clean typography, generous whitespace
- No blank pages — always show pre-filled placeholder content
- Dark mode support throughout
- Tailwind CSS only for styling

## Code Standards
- TypeScript strict mode — explicit types always
- Supabase Row Level Security (RLS) on ALL tables
- Modular, well-commented components built for reuse across phases
- No inline logic — extract to hooks in /lib/hooks

## Public Page
- Route: /app/(creator)/[username]/page.tsx
- Fetches profile + template from Supabase
- Renders selected template with creator's info
- Shows pre-filled placeholder products until creator edits them
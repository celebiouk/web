# cele.bio – Project Rules & Architecture Guide

This document defines how the AI should build and maintain cele.bio.

The goal is to build a premium digital monetization platform with:
- Landing page
- 5 paid courses
- PDF product sales
- 2-hour mentorship booking
- User dashboard
- Admin dashboard
- Link-in-bio generator
- Stripe + PayPal payments

The user is non-technical. Implement everything fully. Keep explanations simple.

---

# STACK

Frontend:
- HTML5 / CSS3 / JavaScript
- React (preferred)
- TailwindCSS (web)
- Nativewind (if React Native / Expo)

Backend:
- Node.js / Express
- OR Serverless (Supabase / Firebase)

Database:
- PostgreSQL (Supabase) OR Firestore

Payments:
- Stripe (primary)
- PayPal (secondary)

Hosting:
- Vercel / Netlify (frontend)
- Supabase / Firebase (backend)
- AWS optional for storage

AI Assistance:
- GitHub Copilot
- ChatGPT for generation
- AI APIs allowed but not required

Design:
- Figma / Canva
- 3D book mockups
- Unsplash images only

---

# PROJECT STRUCTURE (Expo Router Example)

src/app/            → File-based routes  
src/components/     → Reusable UI components  
src/lib/            → Utilities (cn.ts, helpers)  
src/hooks/          → React Query / Zustand hooks  
src/services/       → API layer (Stripe, courses, mentorship)  
src/constants/      → Colors, typography, config  

Never refactor or remove:
src/app/_layout.tsx

---

# ROUTING RULES

- Only ONE route can map to "/"
- Use Expo Router file-based routing
- Dynamic params: use `useLocalSearchParams()`
- Do not create nested stacks that cause double headers
- For modals (like payment confirmation):
  Add route in src/app/
  Configure presentation: "modal"

NO tabs unless there are at least two real sections.

Primary screens:
- /
- /courses
- /course/[id]
- /dashboard
- /mentorship
- /pdf/[id]
- /admin
- /link-in-bio/[username]

---

# TYPESCRIPT RULES (STRICT MODE)

Always:

- Explicit state types:
  useState<Course[]>([])
- Use optional chaining:
  user?.name
- Use nullish coalescing:
  value ?? "N/A"
- Include ALL required properties when creating objects
- Never leave implicit any

All interfaces must be fully defined.

---

# STATE MANAGEMENT

Server State:
- Use React Query
- Always use object syntax:
  useQuery({ queryKey, queryFn })
- Use useMutation for async actions
- No manual loading flags

Local UI State:
- Use Zustand
- Use selectors:
  useStore(s => s.user)
- Do not compute inside selectors

Persist only essential auth/session data using AsyncStorage.

Do NOT wrap RootLayoutNav.

React Query Provider must be outermost provider.

---

# CORE FEATURES TO IMPLEMENT

## 1. Landing Page
- Hero
- 5 Course overview
- Live discount section
- Testimonials
- FAQ
- Footer

## 2. Authentication
- Register
- Login
- JWT or Supabase auth
- Role-based access: user / admin

## 3. Course System
- Course list
- Modules
- Video player
- Progress tracking
- Enrollment after successful payment

## 4. Payments
- Stripe Checkout
- Webhook verification
- On success:
  - Enroll user
  - Unlock dashboard content
- PayPal fallback supported

## 5. User Dashboard
- Enrolled courses
- Progress bars
- Upcoming live sessions
- Mentorship bookings
- PDF purchases
- Notifications

## 6. Mentorship Booking
- 2-hour booking
- Date/time picker
- Stripe payment
- Confirmation email
- Booking status tracking

## 7. PDF Sales
- Dedicated sales page per PDF
- Purchase button
- Secure file delivery
- Purchase history

## 8. Admin Dashboard
- Manage courses
- Manage modules
- Upload PDFs
- View revenue analytics
- Manage users
- View bookings
- Generate link-in-bio pages

## 9. Link-in-Bio Generator
- Create title
- Add links (course, PDF, mentorship)
- Public URL:
  /link-in-bio/[username]

---

# DESIGN RULES (MOBILE FIRST)

Theme:

Primary:
- Deep Navy #0D1B2A
Accent:
- Gold #FFC857
Secondary:
- Teal #1CE7D0
Neutral:
- White, Cool Gray

Avoid:
- Purple gradients
- Flat boring layouts
- Web-like desktop-only layouts

Do:
- Strong CTA buttons
- Depth via shadows
- Premium spacing
- Clear hierarchy
- Smooth animations
- Thumb-friendly spacing

Use Pressable over TouchableOpacity.
No Alert.alert() — use custom modals.

Use SafeAreaView only when custom headers exist.
Never import SafeAreaView from react-native — use react-native-safe-area-context.

---

# DATA RULES

When real API data unavailable:
- Generate realistic mock data

For images:
- Use unsplash.com URLs only

Never hardcode fake payment success.
Use proper Stripe flow or mock test mode realistically.

---

# SECURITY

- Hash passwords (bcrypt)
- Validate Stripe webhooks
- Use HTTPS only
- Protect admin routes
- Validate all user input
- Never expose secret keys in frontend

---

# ENVIRONMENT VARIABLES

If required, request user to add:

- STRIPE_SECRET_KEY
- STRIPE_PUBLIC_KEY
- DATABASE_URL
- JWT_SECRET
- SUPABASE_URL
- SUPABASE_ANON_KEY

Explain clearly how to add them.
Keep it simple.

---

# USER COMMUNICATION RULE

The project owner is likely non-technical.

Always:
- Explain simply
- Avoid jargon
- Scope down if feature is too ambitious
- Do full implementation

Do not give abstract advice.
Build things.

---

# FINAL PRINCIPLE

Cele.bio must feel:

Premium.
Authoritative.
Simple to use.
High-converting.
Scalable.
Owned infrastructure.

Everything must support:
Courses + Mentorship + Digital Asset Ownership.

<skills> You have access to a few skills in the .claude/skills folder. Use them to your advantage. - ai-apis-like-chatgpt: Use this skill when the user asks you to make an app that requires an AI API. - expo-docs: Use this skill when the user asks you to use an Expo SDK module or package that you might not know much about. - frontend-app-design: Use this skill when the user asks you to design a frontend app component or screen. </skills>


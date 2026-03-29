# 🔑 Missing Environment Variables Setup Guide

This file lists all the environment variables you need to add to Vercel. Copy each one and add it to your Vercel project settings.

---

## 🚨 CRITICAL - Add These First (App won't work without them)

### Supabase Project URL
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
```
**What it does:** Connects your frontend and backend API routes to your Supabase project. Without this, auth, data reads/writes, and storage uploads all fail.

**How to get it:** Supabase Dashboard → Project Settings → API → Project URL

---

### Supabase Anon Key
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxx
```
**What it does:** Public key used by the browser for login/signup and normal app queries (still protected by RLS). Without it, users can’t authenticate or load dashboard data.

**How to get it:** Supabase Dashboard → Project Settings → API → anon public key

---

### Supabase Service Role Key
```
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxx
```
**What it does:** Server-only admin key used by secure API routes (webhooks, emails, background jobs). Without it, Stripe webhooks, cron tasks, and system automations fail.

**How to get it:** Supabase Dashboard → Project Settings → API → service_role key

---

### Stripe Secret Key
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Powers all secure Stripe server operations (create payment intents, subscriptions, portal sessions, connect account actions). Without it, checkout and billing break.

**How to get it:** Stripe Dashboard → Developers → API Keys → Secret key

---

### Stripe Webhook Secret
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Verifies webhook signatures from Stripe. Without this, successful payments won’t be marked completed reliably and automations (delivery, subscription updates) can fail.

**How to get it:** Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret

---

### Resend API Key
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Sends transactional and marketing emails (receipts, booking emails, onboarding, broadcasts). Without it, email features silently fail.

**How to get it:** Resend Dashboard → API Keys → Create API key

---

### Stripe Publishable Key
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SlHYlAnKvlQ6AItBFoO5Nhr0Bpn9L5EBtZrJfN74lG4GnT26aleI7QFIxfXo2JXFHgASH07V3dmudbpZBvJRH2c00jkCnIcOZ
```
**What it does:** Loads Stripe's checkout system on your website. Without this, customers can't buy anything because the payment forms won't load on checkout pages.

**How to get it:** Go to Stripe Dashboard → Developers → API Keys → Copy "Publishable key"

---

### Stripe Connect Client ID
```
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Lets creators connect their own Stripe accounts to receive payments directly. Without this, creators can't set up payouts and can't publish products/courses.

**How to get it:** Go to Stripe Dashboard → Settings → Connect → Copy "Client ID"

---

### Stripe Pro Monthly Price ID
```
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Tells Stripe which subscription to charge when someone upgrades to Pro Monthly ($19.99/mo). Without this, the "Upgrade to Pro" button won't work.

**How to get it:** 
1. Go to Stripe Dashboard → Products
2. Find "Cele.bio Pro Monthly" product ($19.99/month)
3. Copy the Price ID (starts with `price_`)
4. If product doesn't exist, run: `npm run billing:setup`

---

### Stripe Pro Yearly Price ID
```
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Tells Stripe which subscription to charge when someone upgrades to Pro Yearly ($167.90/yr). Without this, the yearly upgrade option won't work.

**How to get it:**
1. Go to Stripe Dashboard → Products
2. Find "Cele.bio Pro Yearly" product ($167.90/year)
3. Copy the Price ID (starts with `price_`)
4. If product doesn't exist, run: `npm run billing:setup`

---

### Cron Secret (Security key for scheduled jobs)
```
CRON_SECRET=your_random_secure_string_here_make_it_long_and_random
```
**What it does:** Protects your automated background jobs (email sequences, affiliate commissions, upgrade reminders, payout notifications). Without this, hackers could trigger these jobs and spam your users or mess with commissions.

**How to get it:** Generate a random secure string. Use this command in terminal:
```bash
openssl rand -base64 32
```
Or just type a long random string (letters, numbers, symbols - at least 32 characters)

---

### App URL
```
NEXT_PUBLIC_APP_URL=https://cele.bio
```
**What it does:** Tells the app what your website address is. Used for generating links in emails, redirects after login, OAuth callbacks, and social sharing. Without it, some links might break.

**How to get it:** Just use `https://cele.bio` (your production domain)

---

## 📝 RECOMMENDED - Should Add These (Has defaults but better to set)

### Stripe Customer Portal Return URL
```
STRIPE_CUSTOMER_PORTAL_RETURN_URL=https://cele.bio/dashboard/settings/billing
```
**What it does:** Where to send users after they manage their subscription in Stripe (cancel, update card, view invoices). Without it, they get sent to a generic Stripe page instead of back to your dashboard.

**How to get it:** Just use the value above with your domain

---

### Admin Emails (Who can access /admin routes)
```
ADMIN_EMAILS=profmendel@gmail.com,cc@cele.bio
```
**What it does:** Controls who can access the admin panel (/admin) to view/manage payouts, email broadcasts, and system-wide settings. Only accounts with these emails can see admin features.

**How to get it:** Comma-separated list of admin email addresses

---

### Email Sender Address
```
RESEND_FROM_EMAIL=Cele.bio <noreply@cele.bio>
```
**What it does:** The "From" name and email shown on all automated emails (welcome, receipts, password resets, booking confirmations). Without this, emails will say "from noreply@cele.bio" without the brand name.

**How to get it:** 
1. Go to Resend Dashboard → Domains
2. Verify cele.bio domain if not already done
3. Use format: `Cele.bio <noreply@cele.bio>` or `Cele.bio <hello@cele.bio>`

---

## 💡 OPTIONAL - Add Only If You Need These Features

### TikTok Login Kit (Sandbox / App Review Testing)
```
TIKTOK_CLIENT_ID=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```
**What it does:** Enables “Continue with TikTok” OAuth login using app-managed OAuth routes (`/api/auth/tiktok/start` and `/api/auth/callback/tiktok`).

**How to get it (Sandbox/Test app):**
1. Go to TikTok Developer Portal
2. Open your Login Kit app (sandbox/testing app)
3. Copy **Client Key** → `TIKTOK_CLIENT_ID`
4. Copy **Client Secret** → `TIKTOK_CLIENT_SECRET`

**Redirect URI must match exactly:**
- Local app callback: `http://localhost:3000/api/auth/callback/tiktok`
- Production app callback: `https://www.cele.bio/api/auth/callback/tiktok`

**Scope to request (only):**
- `user.info.basic`

**TikTok OAuth endpoints used by app:**
- Authorization URL: `https://www.tiktok.com/v2/auth/authorize/`
- Token URL: `https://open.tiktokapis.com/v2/oauth/token/`
- Userinfo URL: `https://open.tiktokapis.com/v2/user/info/`

---

### Paystack (For African Countries: Nigeria, Ghana, Kenya, South Africa, Ivory Coast)
```
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Enables creators from Nigeria, Ghana, Kenya, South Africa, and Ivory Coast to receive payments using Paystack. Without this, African creators can't set up payouts (Stripe doesn't work in these countries).

**How to get it:**
1. Sign up at https://paystack.com
2. Complete business verification
3. Go to Settings → API Keys & Webhooks
4. Copy "Secret Key" (use live key for production)

---

### PayPal Connect (For creators to receive PayPal payments)
```
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
PAYPAL_REDIRECT_URI=https://cele.bio/api/paypal/connect/callback
PAYPAL_MODE=live
```
**What it does:** Lets creators connect their PayPal accounts as an alternative to Stripe. Useful for creators who prefer PayPal or need it for specific regions. Without this, PayPal won't show up as a payout option.

**How to get it:**
1. Go to https://developer.paypal.com/dashboard/
2. Create a REST API app
3. Copy Client ID and Secret
4. Set webhook URL to: `https://cele.bio/api/paypal/webhook`
5. Use `PAYPAL_MODE=live` for production (or `sandbox` for testing)

---

### Whereby (Video calls for 1:1 bookings)
```
WHEREBY_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
**What it does:** Automatically creates video call rooms for 1:1 coaching bookings. Without this, bookings still work but you'll need to manually send Zoom/Google Meet links instead.

**How to get it:**
1. Sign up at https://whereby.com
2. Go to Account → API Keys
3. Create new API key
4. Copy the key

---

### Custom Domain Settings (Advanced - usually don't need to change)
```
CUSTOM_DOMAIN_CNAME_TARGET=cname.cele.bio
CUSTOM_DOMAIN_APEX_IP=76.76.21.21
```
**What it does:** Tells the app where custom domains (like creator.com instead of cele.bio/creator) should point. Only needed if you're running custom infrastructure or DNS setup. Default values work fine for most cases.

**How to get it:** Use default values above unless you have custom infrastructure

---

### CreatorLab Additional Redirect URIs (If you have multiple environments)
```
CREATORLAB_REDIRECT_URIS=https://staging.creatorlab.com/callback,https://app.creatorlab.com/callback
```
**What it does:** Allows CreatorLab OAuth to work from multiple domains (production, staging, dev). Only needed if CreatorLab has different environments that need to connect to cele.bio.

**How to get it:** Comma-separated list of additional allowed OAuth callback URLs

---

## 📋 Quick Checklist

Copy this checklist and check off as you add each variable to Vercel:

**Critical (Must Have):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_CONNECT_CLIENT_ID`
- [ ] `STRIPE_PRO_MONTHLY_PRICE_ID`
- [ ] `STRIPE_PRO_YEARLY_PRICE_ID`
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL`

**Recommended:**
- [ ] `STRIPE_CUSTOMER_PORTAL_RETURN_URL`
- [ ] `ADMIN_EMAILS`
- [ ] `RESEND_FROM_EMAIL`

**Optional (Only if needed):**
- [ ] `TIKTOK_CLIENT_ID`
- [ ] `TIKTOK_CLIENT_SECRET`
- [ ] `PAYSTACK_SECRET_KEY`
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_REDIRECT_URI`
- [ ] `PAYPAL_MODE`
- [ ] `WHEREBY_API_KEY`

---

## 🎯 Step-by-Step: Adding to Vercel

1. **Go to your Vercel dashboard:** https://vercel.com/dashboard
2. **Select your cele.bio project**
3. **Go to Settings → Environment Variables**
4. **For each variable above:**
   - Click "Add New"
   - Paste the variable name (e.g., `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
   - Paste the value
   - Select "Production" (and optionally Preview/Development)
   - Click "Save"
5. **After adding all variables, redeploy:**
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"

---

## ⚡ Quick Commands

### Generate Cron Secret
```bash
openssl rand -base64 32
```

### Setup Stripe Products (if Price IDs don't exist)
```bash
npm run billing:setup
```

### Check what env vars are currently set in Vercel
Go to: https://vercel.com/[your-username]/cele-bio/settings/environment-variables

### Local TikTok sandbox test boot
```bash
npm install
npm run dev
```

Then open `http://localhost:3000/login` and click **Continue with TikTok**.

---

## 🆘 Need Help?

- **Stripe Setup:** https://stripe.com/docs/keys
- **Stripe Connect:** https://stripe.com/docs/connect/enable-payment-acceptance-guide
- **Resend Setup:** https://resend.com/docs/introduction
- **Paystack Setup:** https://paystack.com/docs/api/
- **PayPal REST API:** https://developer.paypal.com/api/rest/

---

## ⚠️ Important Security Notes

1. **Never commit these values to Git** - they're already in `.gitignore`
2. **Use LIVE keys for production** - not test keys
3. **Keep your CRON_SECRET private** - it protects your scheduled jobs
4. **Rotate keys if compromised** - generate new ones immediately
5. **Don't share screenshots** of these values

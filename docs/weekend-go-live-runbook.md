# Weekend Go-Live Runbook (cele.bio)

Use this as your exact launch sequence for production release.

## 1) Friday Night — Lock Code

1. Pull latest `main` and ensure clean git status.
2. Run local preflight:
   - `npm install`
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm run test`
   - `npm run lint`
3. If any command fails, fix before launch window.

## 2) Production Env Vars — Must Be Complete

Set all required vars in Vercel Production:

- Core: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Cron: `CRON_SECRET`
- Recommended: `STRIPE_CUSTOMER_PORTAL_RETURN_URL`, `ADMIN_EMAILS`

Optional only if enabled:
- Paystack: `PAYSTACK_SECRET_KEY`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_REDIRECT_URI`, `PAYPAL_MODE`
- Whereby: `WHEREBY_API_KEY`

## 3) Third-Party Dashboards — Production Wiring

### Stripe
1. Confirm Stripe mode is `Live`.
2. Verify webhook endpoint is set to:
   - `https://cele.bio/api/stripe/webhook`
3. Confirm webhook signing secret matches `STRIPE_WEBHOOK_SECRET` in Vercel.
4. Ensure products/prices exist for Pro Monthly + Pro Yearly.

### Supabase
1. Confirm production project is correct.
2. Confirm all required migrations are applied.
3. Validate RLS policies are active on all user tables.

### Resend
1. Verify sending domain (e.g. `cele.bio`).
2. Ensure `RESEND_FROM_EMAIL` is using a verified sender.

### Vercel Cron
`vercel.json` has cron jobs configured. Confirm CRON auth is accepted by routes using `Authorization: Bearer ${CRON_SECRET}`.

## 4) Deploy + Smoke Test

1. Trigger production deploy from `main` in Vercel.
2. After deploy is green, run smoke tests:

### Public
- Homepage loads.
- Creator page loads (`/[username]`).
- Template visuals match expected on mobile and desktop.

### Auth + Onboarding
- Signup and login work.
- Onboarding flow works end-to-end.
- Template selection and profile save work.

### Commerce
- Paid checkout success path works.
- Free product checkout works.
- Order appears in dashboard.
- “My Sales” shows paid + $0 free-guide rows.

### Billing / Connect
- Stripe Connect onboarding starts and returns successfully.
- Upgrade to Pro flow works (monthly/yearly).
- Customer portal link works.

### Webhooks
- Stripe webhook events mark orders/subscriptions correctly.
- Paystack webhook verifies signature and updates order (if enabled).

### Email
- Welcome/order/booking emails send and are delivered.

### Cron Jobs
- Trigger each cron route manually once with auth and verify successful response:
  - `/api/cron/process-email-sequences`
  - `/api/cron/process-affiliate-commissions`
  - `/api/cron/send-upgrade-nudges`
  - `/api/cron/manual-payout-reminders`

## 5) Launch Decision Gate (Go / No-Go)

Go live only if all are true:
- Build, tests, lint, typecheck pass.
- Production env vars are complete.
- Stripe webhook and checkout verified.
- At least one successful real transaction verified.
- Critical pages and dashboard routes pass smoke tests.

## 6) Post-Launch Monitoring (First 24h)

- Check Vercel logs every 1-2 hours.
- Watch Stripe webhook failures.
- Watch Supabase errors and auth failures.
- Watch email deliverability and bounce issues.
- Keep rollback plan ready (revert to last stable commit).

## Quick Commands

```bash
npx tsc --noEmit
npm run build
npm run test
npm run lint
```

---

If you follow this checklist in order, weekend launch risk drops massively and you avoid last-minute surprises.

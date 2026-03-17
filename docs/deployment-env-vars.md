# cele.bio Deployment Environment Variables

This file lists all environment variables currently used by cele.bio for production deployment.

## Core (required)

- `NEXT_PUBLIC_APP_URL` (example: `https://cele.bio`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Stripe (required for payments/billing)

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CONNECT_CLIENT_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`
- `STRIPE_CUSTOMER_PORTAL_RETURN_URL` (recommended explicit value)

## PayPal (optional, if enabling PayPal connect)

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_REDIRECT_URI` (example: `https://cele.bio/api/paypal/connect/callback`)
- `PAYPAL_MODE` (`live` or `sandbox`)

## Email (required for email flows)

- `RESEND_API_KEY`

## Cron routes (required)

- `CRON_SECRET`

## CreatorLab import integration (required for CreatorLab OAuth/import)

- `CREATORLAB_CLIENT_ID` (or fallback: `CLIENT_ID`)
- `CREATORLAB_CLIENT_SECRET` (or fallback: `CLIENT_SECRET`)
- `CREATORLAB_REDIRECT_URI` (or fallback: `REDIRECT_URI`)
- `CREATORLAB_REDIRECT_URIS` (optional multi-URI allowlist, comma-separated)
- `CREATORLAB_IMPORT_WEBHOOK_URL` (optional; required only if webhook delivery is enabled)
- `CREATORLAB_WEBHOOK_SECRET` (optional; required with webhook URL)

## Optional features

- `WHEREBY_API_KEY` (booking video room creation)
- `CUSTOM_DOMAIN_CNAME_TARGET` (custom domain DNS target override)
- `CUSTOM_DOMAIN_APEX_IP` (custom domain A record target override)

---

## Production template

```env
NEXT_PUBLIC_APP_URL=https://cele.bio

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_CUSTOMER_PORTAL_RETURN_URL=https://cele.bio/dashboard/settings/billing

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_REDIRECT_URI=https://cele.bio/api/paypal/connect/callback
PAYPAL_MODE=live

RESEND_API_KEY=

CRON_SECRET=

CREATORLAB_CLIENT_ID=
CREATORLAB_CLIENT_SECRET=
CREATORLAB_REDIRECT_URI=https://creatorlab.example.com/auth/integrations/celebio/callback
# CREATORLAB_REDIRECT_URIS=https://creatorlab.example.com/callback,https://staging.creatorlab.example.com/callback
# CREATORLAB_IMPORT_WEBHOOK_URL=
# CREATORLAB_WEBHOOK_SECRET=

# Optional
# WHEREBY_API_KEY=
# CUSTOM_DOMAIN_CNAME_TARGET=cname.cele.bio
# CUSTOM_DOMAIN_APEX_IP=76.76.21.21
```

## Notes

- Never commit real secrets to Git.
- Set these in your deployment provider (e.g. Vercel) for `Production` (and optionally `Preview`/`Development`).
- If CreatorLab webhooks are not needed yet, you can leave the webhook variables unset.

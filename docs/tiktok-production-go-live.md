# TikTok Login Kit — Production Go-Live Checklist

Use this checklist to move TikTok Login Kit from testing to stable production.

## 1) TikTok Portal (Production App)

1. Open TikTok Developer Portal.
2. Open your **Production** app (not sandbox).
3. Confirm product is **Login Kit**.
4. Confirm approved scopes include only:
   - `user.info.basic`
5. Confirm Redirect URIs include exact values:
   - `https://www.cele.bio/api/auth/callback/tiktok`
   - `https://cele.bio/api/auth/callback/tiktok` (recommended fallback)
   - `http://localhost:3000/api/auth/callback/tiktok` (optional dev only)

## 2) Vercel Environment Variables (Production)

Set these in Vercel Project Settings → Environment Variables:

- `TIKTOK_CLIENT_ID`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI=https://www.cele.bio/api/auth/callback/tiktok`
- `TIKTOK_OAUTH_SCOPE=user.info.basic`

Notes:
- `TIKTOK_REDIRECT_URI` is now used as canonical callback URL in OAuth start+callback routes.
- Keep `TIKTOK_OAUTH_SCOPE` minimal for approval/safety.

## 3) Supabase URL Configuration

In Supabase Dashboard → Authentication → URL Configuration, include:

- `https://www.cele.bio/api/auth/callback/tiktok`
- `https://cele.bio/api/auth/callback/tiktok`
- `http://localhost:3000/api/auth/callback/tiktok` (optional for local dev)

## 4) Deploy + Verify

1. Trigger production deploy (push to `main`).
2. Open `https://www.cele.bio/login`.
3. Click **Continue with TikTok**.
4. Complete consent.
5. Verify redirect lands back in cele.bio and user is logged in.

## 5) Data Verification

In Supabase table editor (`profiles`), verify for the TikTok user row:
- `full_name` populated
- `avatar_url` populated

In onboarding setup and public page, verify avatar displays correctly.

## 6) Rollback / Quick Fixes

- `redirect mismatch`:
  - Make TikTok portal redirect URI and `TIKTOK_REDIRECT_URI` exactly identical.
- `tiktok_not_configured`:
  - Add `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET` in Vercel and redeploy.
- `tiktok_auth_failed`:
  - Re-check client key/secret pair, approved scope, and callback URL exactness.

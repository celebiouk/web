# TikTok Sandbox Approval Recording Checklist

Use this to record the exact proof video TikTok reviewers usually expect.

## Supabase Custom Provider Setup (Full Instructions)

Use this if you want Supabase-managed TikTok OAuth instead of app-managed OAuth routes.

1. Open Supabase Dashboard → **Authentication** → **Providers** → **Custom Providers**.
2. Click **New Provider**.
3. Set **Provider Type** to **OAuth2**.
4. Fill fields exactly:

   - **Provider Identifier**: `tiktok`
   - **Display Name**: `TikTok`
   - **Configuration Method**: `Manual configuration`
   - **Client ID**: `sbaw5c6nmr1nnvlub4`
   - **Client Secret**: `ql4K3OkeIg3QJir3usDkvL01PcsvCb6a`
   - **Scopes**: `user.info.basic`
   - **Allow users without email**: `ON`

5. OAuth endpoint values:

   - **Authorization URL**: `https://www.tiktok.com/v2/auth/authorize/`
   - **Token URL**: `https://open.tiktokapis.com/v2/oauth/token/`
   - **User Info URL**: `https://open.tiktokapis.com/v2/user/info/`

6. If Supabase shows **Issuer URL** / **Discovery URL** in OAuth2 mode:

   - Set **Issuer URL** to: `https://www.tiktok.com`
   - Leave **Discovery URL** empty

7. Click **Create and enable provider**.
8. Copy the **Callback URL** shown at the bottom of the form.
9. Go to TikTok Developer Portal (sandbox app) and add that callback URL as an allowed Redirect URI.
10. Save in TikTok portal and return to Supabase.

### Required URL alignment checks

- The redirect URI in TikTok portal must match Supabase callback exactly (character-for-character).
- In Supabase Authentication → URL Configuration, include:
  - `http://localhost:3000/api/auth/callback/tiktok`
  - `https://www.cele.bio/api/auth/callback/tiktok`
- Keep product/scope minimal for review:
  - Product: Login Kit only
  - Scope: `user.info.basic` only

## Before Recording (2 min)

1. Confirm local app is running:
   - `npm run dev`
2. Confirm TikTok sandbox credentials are set in local env:
   - `TIKTOK_CLIENT_ID=sbaw5c6nmr1nnvlub4`
   - `TIKTOK_CLIENT_SECRET=ql4K3OkeIg3QJir3usDkvL01PcsvCb6a`
3. Confirm TikTok Login Kit redirect URI in TikTok portal exactly matches:
   - `http://localhost:3000/api/auth/callback/tiktok`
4. Confirm production redirect URI (if recording on prod) is also added:
   - `https://www.cele.bio/api/auth/callback/tiktok`
5. Confirm Supabase Redirect URLs include:
   - `http://localhost:3000/api/auth/callback/tiktok`
   - `https://www.cele.bio/api/auth/callback/tiktok`
6. Confirm app requests only scope:
   - `user.info.basic`

## Recording Script (what to show on screen)

1. Show browser URL bar at `http://localhost:3000/login`.
2. Click **Continue with TikTok**.
3. Show TikTok consent screen appears.
4. Complete login/consent.
5. Show redirect back to cele.bio app.
6. Show you are logged in (dashboard or onboarding opens).
7. Open Supabase table editor and show `profiles` row for this user:
   - `full_name` populated
   - `avatar_url` populated
8. Show logout and login again with TikTok works consistently.

## If Review Team Wants Production URL Demo

Repeat the same recording using:
- `https://www.cele.bio/login`
- TikTok redirect URI: `https://www.cele.bio/api/auth/callback/tiktok`

## Common Failures + Quick Fix

- **Error: redirect mismatch**
   - Fix TikTok portal redirect URI to exact app callback URL (`/api/auth/callback/tiktok`).
- **Error: TikTok not configured**
   - Add `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET` to app env and restart dev server.
- **Error after callback to login**
  - Re-check `TIKTOK_CLIENT_ID`/`TIKTOK_CLIENT_SECRET` and Supabase provider config.
- **Missing display name/avatar in profiles**
  - Confirm scope is `user.info.basic` and user completed consent.

## Evidence to Send

- Single video with full login flow + callback + profile row proof.
- Include timestamp and visible URL bar during flow.

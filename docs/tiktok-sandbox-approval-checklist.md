# TikTok Sandbox Approval Recording Checklist

Use this to record the exact proof video TikTok reviewers usually expect.

## Before Recording (2 min)

1. Confirm local app is running:
   - `npm run dev`
2. Confirm TikTok sandbox credentials are set in local env:
   - `TIKTOK_CLIENT_ID`
   - `TIKTOK_CLIENT_SECRET`
3. Confirm app env has TikTok sandbox credentials:
   - `TIKTOK_CLIENT_ID`
   - `TIKTOK_CLIENT_SECRET`
4. Confirm TikTok Login Kit redirect URI in TikTok portal exactly matches:
   - `http://localhost:3000/api/auth/callback/tiktok`
5. Confirm production redirect URI (if recording on prod) is also added:
   - `https://www.cele.bio/api/auth/callback/tiktok`
6. Confirm Supabase Redirect URLs include:
   - `http://localhost:3000/api/auth/callback/tiktok`
   - `https://www.cele.bio/api/auth/callback/tiktok`
7. Confirm app requests only scope:
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

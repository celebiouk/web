# Google OAuth — Production Go-Live Checklist

Use this checklist to move Google sign-in from testing to stable production.

## 1) Google Cloud Console (Production OAuth Client)

1. Open Google Cloud Console.
2. Open your production project.
3. Go to APIs & Services → Credentials.
4. Open your OAuth 2.0 Client ID used by Supabase Auth.
5. Confirm Authorized JavaScript origins include:
   - `https://www.cele.bio`
   - `https://cele.bio` (recommended fallback)
   - `http://localhost:3000` (optional dev)
6. Confirm Authorized redirect URIs include your Supabase callback URL:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

## 2) Supabase Auth Provider Setup

In Supabase Dashboard → Authentication → Providers → Google:

- Enable Google provider
- Paste Google Client ID
- Paste Google Client Secret

Notes:
- Google credentials are configured in Supabase, not Vercel.
- If provider is disabled or credentials are wrong, login will fail with `provider is not enabled` or `server_error`.

## 3) Supabase URL Configuration

In Supabase Dashboard → Authentication → URL Configuration, include:

- `https://www.cele.bio/auth/callback`
- `https://cele.bio/auth/callback`
- `http://localhost:3000/auth/callback` (optional for local dev)

Notes:
- The app uses `/auth/callback` for Google OAuth completion.
- Production now prefers `NEXT_PUBLIC_APP_URL` for callback consistency.

## 4) Vercel Environment Variables

Set these in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_APP_URL=https://www.cele.bio` (recommended canonical domain)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5) Deploy + Verify

1. Trigger production deploy (push to `main`).
2. Open `https://www.cele.bio/login`.
3. Click **Continue with Google**.
4. Complete consent.
5. Verify redirect lands back on cele.bio and user is logged in.

## 6) Data Verification

In Supabase table editor (`profiles`), verify for the new Google user row:

- `id` exists and matches auth user
- `full_name` and `avatar_url` are populated when available

If missing, verify your onboarding flow still lets the user complete profile setup.

## 7) Rollback / Quick Fixes

- `provider is not enabled`:
  - Enable Google in Supabase Auth Provider settings and save credentials.
- `redirect_uri_mismatch`:
  - Ensure exact callback URLs are set in both Google Cloud and Supabase URL Configuration.
- Generic `server_error`:
  - Re-check Google client ID/secret pair in Supabase and retry.

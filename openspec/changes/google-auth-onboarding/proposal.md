## Why

The app currently uses Google OAuth in "Testing" mode, limiting login to specific test accounts. We need to open it to all users, add an onboarding step to set a display name after first login, and grant admin privileges to the owner account (hsunhuazhen@gmail.com).

## What Changes

- Google OAuth app published to production (manual step in Google Cloud Console)
- `users` table gets a `username` column (nullable) and `role` column (`user` | `admin`)
- After Google login, if `username` is null, redirect to `/onboarding` to set display name
- `hsunhuazhen@gmail.com` is automatically assigned `admin` role on first login
- JWT payload includes `role` so frontend can adapt UI for admin

## Non-Goals

- No email/password authentication
- No admin dashboard UI (just the role stored for future use)

## Capabilities

### New Capabilities

- `user-onboarding`: First-login flow to set display name before entering the app

### Modified Capabilities

- `authentication`: Google OAuth opened to all users; JWT now includes role

## Impact

- Affected specs: authentication, user-onboarding
- Affected code:
  - Modified: packages/api/src/db/schema.sql
  - Modified: packages/api/src/auth/google.ts
  - Modified: packages/api/src/auth/jwt.ts
  - Modified: packages/web/src/app/auth/callback/page.tsx
  - New: packages/web/src/app/onboarding/page.tsx
  - New: packages/api/src/routes/users.ts

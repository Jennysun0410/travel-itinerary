# Tasks

- [x] T1: Add `username` (TEXT, nullable) and `role` (TEXT default 'user') columns to the `users` table in schema.sql; run ALTER TABLE on Railway
- [x] T2: Update `packages/api/src/auth/google.ts` to set `role = 'admin'` when email is `hsunhuazhen@gmail.com`, and include `role` + `username` in the JWT payload
- [x] T3: Update `packages/api/src/auth/jwt.ts` JwtPayload type to include `role` and `username`
- [x] T4: Update `packages/api/src/routes/auth.ts` callback to pass `username` in redirect so frontend knows if onboarding is needed
- [x] T5: Create `packages/api/src/routes/users.ts` with PATCH `/users/me` endpoint to update `username`
- [x] T6: Register the users router in `packages/api/src/index.ts`
- [x] T7: Update `packages/web/src/app/auth/callback/page.tsx` to redirect to `/onboarding` if username is not set
- [x] T8: Create `packages/web/src/app/onboarding/page.tsx` — a form to set display name, calls PATCH `/users/me`, then redirects to `/trips`

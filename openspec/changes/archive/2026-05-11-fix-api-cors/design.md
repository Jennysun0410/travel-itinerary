## Context

The Express API runs on Railway (`travel-itinerary-github-repo.up.railway.app`). The Next.js frontend runs on Vercel (`travel-itinerary-web.vercel.app`). These are different origins, so browsers enforce CORS on all fetch() calls from the frontend to the API.

## Goals / Non-Goals

**Goals**: Allow the Vercel frontend and local dev frontend to call the API.
**Non-Goals**: Wildcard CORS (`*`) — this would expose the API to any origin.

## Decisions

### Use the `cors` npm package with an allowlist

Add `cors` as the first Express middleware. Configure an explicit origin allowlist rather than `origin: '*'` to avoid exposing authenticated endpoints to arbitrary origins.

Allowed origins:
- `https://travel-itinerary-web.vercel.app` (production)
- `http://localhost:3000` (local Next.js dev server)

`credentials: true` is required so the browser sends the `Authorization` header.

Alternative considered: manually set headers in a custom middleware — rejected because `cors` handles preflight OPTIONS requests automatically.

## Risks / Trade-offs

[Risk] Future Vercel preview deployment URLs (e.g., `travel-itinerary-web-xyz.vercel.app`) are not in the allowlist → Mitigation: Add a regex pattern matching `*.vercel.app` subdomains in the cors origin function, or extend the allowlist when needed.

## Migration Plan

1. Install `cors` and `@types/cors` in `packages/api`
2. Add `app.use(cors(...))` before all route registrations in `packages/api/src/index.ts`
3. Redeploy to Railway — no database migration needed

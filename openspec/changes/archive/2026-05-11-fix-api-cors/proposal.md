## Problem

All API calls from the Vercel-hosted frontend (`travel-itinerary-web.vercel.app`) to the Railway-hosted API (`travel-itinerary-github-repo.up.railway.app`) fail with "Failed to fetch" because the Express API has no CORS middleware. The browser blocks cross-origin requests by default.

Affected calls include:
- GET /trips (My Trips page — silently fails, shows empty list)
- POST /trips (Create Trip — shows "Failed to fetch" error)
- All other authenticated API endpoints

## Root Cause

`packages/api/src/index.ts` mounts all routers but never calls `app.use(cors(...))`. Without the `cors` package configured, Express returns no `Access-Control-Allow-Origin` header, causing browsers to block responses from a different origin.

## Proposed Solution

Install the `cors` npm package in `packages/api` and add it as the first middleware in `packages/api/src/index.ts`, allowing requests from `https://travel-itinerary-web.vercel.app` and `http://localhost:3000` (for local development).

## Success Criteria

- POST /trips from the Vercel frontend returns 201 and creates the trip
- GET /trips from the Vercel frontend returns the trip list
- All other authenticated API routes respond normally from the browser
- Local development (`localhost:3000` → `localhost:3001`) continues to work

## Impact

- Affected code:
  - Modified: `packages/api/src/index.ts`, `packages/api/package.json`

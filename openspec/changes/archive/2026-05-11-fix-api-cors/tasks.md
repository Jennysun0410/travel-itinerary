## Tasks

- [x] Install `cors` and `@types/cors` packages in `packages/api`: run `npm install cors` and `npm install --save-dev @types/cors` inside `packages/api`, then verify both appear in `packages/api/package.json` dependencies.
- [x] Add CORS middleware to `packages/api/src/index.ts`: import `cors` from `'cors'`, then add `app.use(cors({ origin: ['https://travel-itinerary-web.vercel.app', 'http://localhost:3000'], credentials: true }))` as the very first `app.use()` call before any router registrations.
- [x] Commit and push to trigger Railway redeploy: stage `packages/api/package.json`, `packages/api/package-lock.json`, and `packages/api/src/index.ts`, commit with message `fix: add CORS middleware to allow Vercel frontend`, push to `main`.

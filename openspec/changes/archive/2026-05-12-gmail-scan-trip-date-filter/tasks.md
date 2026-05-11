## Tasks

- [x] 1. Update `packages/api/src/email/parser.ts`: Add optional parameter `tripDateRange?: { start: string; end: string }` to `parseEmail` and `enqueueEmailForParsing`. After Claude returns the parsed result, if `tripDateRange` is provided: (a) if `parsed.start_datetime` is null or absent, return without inserting; (b) extract the date portion of `start_datetime` (`YYYY-MM-DD` substring from the ISO string) and compare — if it is before `tripDateRange.start` or after `tripDateRange.end`, return without inserting. This implements the "Gmail scan SHALL filter orders by trip date range when trip_id is provided" requirement.

- [x] 2. Update `packages/api/src/email/gmail.ts`: Add optional parameter `tripDateRange?: { start: string; end: string }` to `scanGmailByDateRange`. Pass it through to `enqueueEmailForParsing` for each message processed in the loop.

- [x] 3. Update `packages/api/src/routes/email.ts`: In `POST /email/gmail/scan`, destructure `trip_id` from the request body alongside existing fields. If `trip_id` is present, query `SELECT start_date, end_date FROM trips WHERE id = $1` using the authenticated user's context (no ownership check needed — scan is already auth-gated). If a row is found, build `tripDateRange = { start: row.start_date (YYYY-MM-DD string), end: row.end_date (YYYY-MM-DD string) }` and pass it to `scanGmailByDateRange`. If no row is found or `trip_id` is absent, call `scanGmailByDateRange` without `tripDateRange`. This implements the "Gmail scan request accepts optional trip_id" requirement.

- [x] 4. Update `packages/web/src/app/trips/[id]/orders/page.tsx`: In `handleScan`, add `trip_id: params.id` to the JSON body of the `POST /email/gmail/scan` request alongside existing `from` and `to` fields.

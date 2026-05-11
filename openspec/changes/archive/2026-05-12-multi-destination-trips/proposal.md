## Why

The current trip creation form requires a single text destination field that is used to guess timezones via an English-only keyword lookup. Users who type Chinese city names (e.g., "香港") get no timezone benefit. Multi-city trips have no representation at all. This makes the Timeline view's time display unreliable.

## What Changes

- The single `destination` text field is replaced by a multi-select list where each entry is a city chosen from a dropdown (with Chinese labels) plus a date range (from/to).
- The trip's overall start and end dates are auto-derived from the earliest and latest destination dates — users no longer set them manually.
- Trip destinations are stored as a JSONB array on the trips table.
- The email parser extracts booking dates from parsed emails and stores them on orders.
- The Timeline uses the booking date and trip destination periods to resolve the correct IANA timezone for each order.
- The New Trip page layout is centered.

## Capabilities

### New Capabilities

- `multi-destination-management`: Users can add multiple destinations (city + date range) to a trip, each mapped to a timezone.
- `email-date-extraction`: Email parser extracts check-in/checkout or departure/arrival dates from booking emails and stores them on orders.
- `per-order-timezone`: Timeline resolves timezone per order by matching the order's booking date against the trip's destination periods.

### Modified Capabilities

- `trip-creation`: Trip creation now accepts a destinations array instead of a single destination string. Start/end dates are derived automatically.

## Impact

- Affected specs: multi-destination-management, email-date-extraction, per-order-timezone, trip-creation
- Affected code:
  - Modified: `packages/api/src/routes/trips.ts`, `packages/api/src/email/parser.ts`, `packages/web/src/app/trips/new/page.tsx`, `packages/web/src/app/trips/[id]/timeline/page.tsx`, `packages/web/src/shared/datetime.ts`, `packages/web/src/shared/types.ts`
  - New: `packages/api/src/db/migrate-destinations.ts`
  - Removed: (none)

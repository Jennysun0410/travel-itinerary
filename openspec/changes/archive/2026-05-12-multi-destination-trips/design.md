## Context

The trips table currently has a single `destination TEXT` column. The frontend uses this string to call `guessTimezoneFromDestination()`, an English-only keyword lookup. Email parsing extracts type/title/description but not dates. Timeline displays all times in a single timezone derived from the trip destination.

## Goals / Non-Goals

**Goals**: Multi-city trips with per-destination timezone accuracy; email parser captures booking dates; new trip form is centered and user-friendly.
**Non-Goals**: Free-text destination entry; user-editable timezone override; mobile app changes.

## Decisions

### Store destinations as JSONB array on trips table

Add a `destinations JSONB NOT NULL DEFAULT '[]'` column to the trips table. Each element: `{ name: string, timezone: string, startDate: string, endDate: string }`. Keep the existing `destination TEXT` column as the first destination's name for backwards-compatible display on the My Trips list.

Alternative considered: separate `trip_destinations` table — rejected because the JSONB approach avoids a JOIN for the common read path and the destination list is always fetched as part of the trip.

### Derive trip start/end from destination dates

`start_date` = min of all destination `startDate` values. `end_date` = max of all destination `endDate` values. Computed in the API before INSERT. Users no longer send `start_date`/`end_date` directly.

### City dropdown with hardcoded list + timezone mapping

The frontend maintains a constant `CITY_OPTIONS` array: `{ label: string (Chinese), value: string (English key), timezone: string (IANA) }`. The API stores the IANA timezone directly on each destination object so no guessing is needed at read time.

Cities included: 香港, 東京/大阪/京都, 台北, 新加坡, 曼谷, 首爾, 倫敦, 巴黎, 柏林, 紐約, 洛杉磯, 雪梨, 其他（瀏覽器時區）.

### Per-order timezone from destination periods

When Timeline renders an order's time, it calls `resolveTimezone(orderDate, tripDestinations)`: iterate destinations sorted by startDate; return the first destination whose `[startDate, endDate]` range contains the order date. Fall back to browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) if no match.

### Email parser extracts booking dates

The parser adds a `bookingDate: string | null` field to its output. For flights: parse departure datetime. For hotels: parse check-in date. For activities: parse event date. Uses regex on common patterns (e.g., `Check-in: May 5, 2026`, `Departure: 2026-05-05 14:30`). Stored in the `orders.booking_date` column (new TEXT column, nullable).

## Risks / Trade-offs

[Risk] Regex date extraction is brittle for edge-case email formats → Mitigation: null value is acceptable; Timeline falls back to browser timezone.

[Risk] Destination date ranges may have gaps (e.g., travel day between cities) → Mitigation: fallback to browser timezone for dates not covered by any destination period.

## Migration Plan

1. Run migration script `packages/api/src/db/migrate-destinations.ts` against Railway DB: adds `destinations JSONB` to trips and `booking_date TEXT` to orders.
2. Populate `destinations` from existing `destination` text for old trips (best-effort, no date range — store as `[{ name: destination, timezone: guessTimezoneFromDestination(destination), startDate: start_date, endDate: end_date }]`).
3. Deploy updated API and frontend together.

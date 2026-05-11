# gmail-scan-trip-date-filter Specification

## Purpose

TBD - created by archiving change 'gmail-scan-trip-date-filter'. Update Purpose after archive.

## Requirements

### Requirement: Gmail scan SHALL filter orders by trip date range when trip_id is provided

When `POST /email/gmail/scan` is called with a `trip_id`, the system SHALL query the trip's `start_date` and `end_date` from the database and pass them to the email parser. The parser SHALL skip inserting any order whose Claude-parsed `start_datetime` does not fall within `[trip_start, trip_end]` (inclusive, date-level comparison). If `start_datetime` cannot be parsed from the email and a trip date range is provided, the email SHALL be skipped.

#### Scenario: Booking within trip dates is imported
- **GIVEN** a trip with start_date=2026-01-20 and end_date=2026-01-25
- **AND** a Gmail scan is triggered with trip_id for that trip
- **WHEN** Claude parses an email and returns start_datetime="2026-01-21T14:00:00Z"
- **THEN** the order is inserted into the database with trip_id set

#### Scenario: Booking outside trip dates is skipped
- **GIVEN** a trip with start_date=2026-01-20 and end_date=2026-01-25
- **AND** a Gmail scan is triggered with trip_id for that trip
- **WHEN** Claude parses an email and returns start_datetime="2026-08-05T10:00:00Z"
- **THEN** the order is NOT inserted and no error is returned

#### Scenario: Email with unparseable start_datetime is skipped when filtering
- **GIVEN** a trip date range is provided
- **WHEN** Claude cannot extract start_datetime from the email (returns null)
- **THEN** the email is skipped, not inserted with a fallback date

#### Scenario: Scan without trip_id retains existing behaviour
- **GIVEN** no trip_id is provided in the scan request
- **WHEN** Gmail scan runs
- **THEN** all booking emails are imported regardless of their start_datetime

<!-- @trace
source: gmail-scan-trip-date-filter
updated: 2026-05-12
code:
  - packages/api/src/email/gmail.ts
  - packages/web/src/app/trips/[id]/orders/page.tsx
  - packages/api/src/email/parser.ts
  - packages/api/src/routes/email-scan.ts
-->
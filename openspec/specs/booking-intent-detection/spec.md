# booking-intent-detection Specification

## Purpose

TBD - created by archiving change 'robust-email-parsing'. Update Purpose after archive.

## Requirements

### Requirement: Claude parser SHALL detect booking intent before inserting

The email parser SHALL include `is_booking` as a top-level field in the Claude response JSON. If `is_booking` is `false`, the parser SHALL return without inserting any record into the orders table.

The Claude prompt SHALL explicitly instruct: set `is_booking: true` only if the email is a booking/reservation confirmation (flight, accommodation, or activity). Promotional emails, newsletters, and payment receipts without booking details SHALL result in `is_booking: false`.

The `is_booking` field SHALL be added to the existing JSON schema returned by Claude:
```json
{
  "is_booking": true,
  "type": "flight" | "accommodation" | "activity",
  "vendor": string or null,
  "booking_ref": string or null,
  "start_datetime": ISO 8601 or null,
  "end_datetime": ISO 8601 or null,
  "price": number or null,
  "currency": 3-letter ISO code or null
}
```

#### Scenario: Promotional email is discarded
- **GIVEN** an email from agoda.com with subject "Special offers just for you"
- **WHEN** Claude processes the email content
- **THEN** Claude SHALL return `is_booking: false` and no order record SHALL be created

#### Scenario: Booking confirmation is processed
- **GIVEN** an Agoda booking confirmation email with booking reference and check-in date
- **WHEN** Claude processes the email content
- **THEN** Claude SHALL return `is_booking: true` and an order record SHALL be inserted

<!-- @trace
source: robust-email-parsing
updated: 2026-05-12
code:
  - packages/api/src/routes/orders.ts
  - packages/web/tsconfig.tsbuildinfo
  - packages/api/src/email/parser.ts
  - packages/web/src/app/trips/[id]/orders/page.tsx
  - packages/api/src/email/gmail.ts
-->
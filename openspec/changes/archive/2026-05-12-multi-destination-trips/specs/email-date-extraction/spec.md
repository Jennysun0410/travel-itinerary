## ADDED Requirements

### Requirement: Email parser extracts booking date

The email parser SHALL extract a `bookingDate` (ISO date string YYYY-MM-DD or null) from each parsed email in addition to existing fields. Extraction rules by order type:
- flight: parse the departure date from patterns like "Departure: MMM D, YYYY" or "出發：YYYY-MM-DD"
- accommodation: parse the check-in date from patterns like "Check-in: MMM D, YYYY" or "入住：YYYY-MM-DD"
- activity: parse the event date from patterns like "Date: MMM D, YYYY" or "日期：YYYY-MM-DD"

If no date is found, `bookingDate` SHALL be null.

#### Scenario: Flight email date extraction

- **WHEN** the parser processes an email containing "Departure: May 5, 2026"
- **THEN** the parsed order includes `bookingDate: "2026-05-05"`

#### Scenario: Hotel email date extraction

- **WHEN** the parser processes an email containing "Check-in: April 1, 2026"
- **THEN** the parsed order includes `bookingDate: "2026-04-01"`

#### Scenario: No recognizable date in email

- **WHEN** the parser processes an email with no date pattern match
- **THEN** the parsed order includes `bookingDate: null`

### Requirement: Booking date stored on order

The orders table SHALL have a `booking_date TEXT` column (nullable). When an order is created from a parsed email, the `bookingDate` value SHALL be stored in `booking_date`. Existing orders without a booking date SHALL have `booking_date = null`.

#### Scenario: Order saved with booking date

- **WHEN** a parsed email produces `bookingDate: "2026-04-01"` and the order is saved
- **THEN** `orders.booking_date = "2026-04-01"` in the database

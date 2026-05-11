## ADDED Requirements

### Requirement: Scan Gmail by date range for booking emails

The system SHALL provide an API endpoint that searches a user's connected Gmail account for booking confirmation emails within a specified date range and imports them as orders.

#### Scenario: Successful scan with results

- **GIVEN** a user has a connected Gmail account
- **WHEN** `POST /email/gmail/scan` is called with `{ "from": "2026-01-01", "to": "2026-05-12" }`
- **THEN** the system searches Gmail for emails with booking-related subjects within that date range, parses each email, creates orders for matched emails, and returns `{ "imported": 3, "skipped": 1 }` where imported is newly created orders and skipped is already-imported duplicates

#### Scenario: User has no Gmail connection

- **GIVEN** a user has not connected any Gmail account
- **WHEN** `POST /email/gmail/scan` is called
- **THEN** the API returns 400 with `error: "no_gmail_connection"`

#### Scenario: Date range validation failure

- **WHEN** `POST /email/gmail/scan` is called with `from` after `to`, or either field is missing
- **THEN** the API returns 400 with `error: "validation_error"`

##### Example:

- Input: `{ "from": "2026-03-01", "to": "2026-03-31" }`
- Gmail query: `subject:(booking confirmation OR reservation OR order confirmation OR e-ticket) after:2026/03/01 before:2026/03/31`
- Response: `{ "imported": 3, "skipped": 1 }`

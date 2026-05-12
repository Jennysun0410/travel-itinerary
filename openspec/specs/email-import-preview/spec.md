# email-import-preview Specification

## Purpose

Allows users to preview Gmail-parsed orders before importing. Users scan a date range, review the parsed results with checkboxes, and confirm which orders to add to the trip.

## Requirements

### Requirement: Preview parsed orders before importing

The system SHALL provide a preview endpoint that scans the user's Gmail for booking confirmation emails within a date range, parses them, and returns the parsed results without writing to the database. The preview response SHALL include for each parsed order: vendor, type, booking_ref, start_datetime, end_datetime, price, currency, flagged_for_review, and raw_email_id.

#### Scenario: Successful preview

- **WHEN** a user with a connected Gmail account calls POST /email/gmail/preview with valid from and to dates and a trip_id
- **THEN** the system SHALL return an array of ParsedOrder objects representing emails that match booking criteria, without creating any database records

#### Scenario: No matching emails

- **WHEN** the Gmail scan finds no emails matching the booking filter in the given date range
- **THEN** the system SHALL return an empty array with status 200

#### Scenario: No Gmail connection

- **WHEN** a user calls POST /email/gmail/preview without a connected Gmail account
- **THEN** the system SHALL return status 400 with error code no_gmail_connection

---
### Requirement: Confirm and import selected orders

The system SHALL provide an import endpoint that accepts a list of ParsedOrder objects and a trip_id, inserts each as an order with that trip_id, and returns the count of imported orders. Duplicate orders (same raw_email_id already exists in the database) SHALL be skipped silently using ON CONFLICT DO NOTHING.

#### Scenario: User imports selected orders

- **WHEN** a user submits a confirmed list of ParsedOrder objects with a valid trip_id to POST /email/gmail/import
- **THEN** the system SHALL insert each order with the given trip_id and return { imported: N } where N is the number of rows actually inserted

#### Scenario: Duplicate order skipped

- **WHEN** a ParsedOrder with a raw_email_id that already exists in the orders table is submitted
- **THEN** the system SHALL skip that order silently and not count it in the imported total

##### Example: partial import with duplicate

- **GIVEN** 3 ParsedOrders submitted, where raw_email_id "abc" already exists in DB
- **WHEN** POST /email/gmail/import is called
- **THEN** 2 orders are inserted and the response is { imported: 2 }

---
### Requirement: Orders page preview flow

The web Orders page SHALL present email import as a three-step flow: (1) user enters date range, (2) system displays a preview list of parsed orders with checkboxes, (3) user confirms selection and orders are saved to the trip.

#### Scenario: User completes preview and import

- **WHEN** a user submits a date range and the preview returns results
- **THEN** the Orders page SHALL display each parsed order as a row showing vendor, type, dates, price, and a "待確認" badge if flagged_for_review is true, with a checkbox selected by default

#### Scenario: User confirms import

- **WHEN** a user clicks the confirm import button with at least one order checked
- **THEN** the system SHALL call POST /email/gmail/import with the selected ParsedOrders and trip_id, and on success reload the orders list so newly imported orders appear immediately

#### Scenario: User deselects all and cancels

- **WHEN** a user deselects all checkboxes or clicks cancel
- **THEN** no orders are imported and the preview panel closes

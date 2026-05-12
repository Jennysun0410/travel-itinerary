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

The web Orders page SHALL embed the Gmail import flow inside the "Add orders" modal. The import flow SHALL run as an in-place mode switch (not a separate popup). The confirmation step (確認訂單) SHALL allow per-row inline editing of all parsed order fields and per-row removal from the import list before the user confirms import.

#### Scenario: Import flow runs inside Add orders modal

- **WHEN** a user clicks `[import from mail]` inside the "Add orders" modal
- **THEN** the modal SHALL switch to import mode, displaying the 5-step flow (選擇日期 → 掃描信箱 → 確認訂單 → 加入行程 → 加入成功) within the same overlay

#### Scenario: Per-row inline edit in confirmation step

- **WHEN** a user clicks the edit button on a parsed order row in the 確認訂單 step
- **THEN** the row SHALL expand to show editable fields for vendor, type, booking_ref, start_datetime, end_datetime, price, and currency
- **THEN** only one row SHALL be in edit mode at a time

#### Scenario: Per-row removal in confirmation step

- **WHEN** a user clicks the remove button on a parsed order row in the 確認訂單 step
- **THEN** that order SHALL be removed from the preview list and will not be imported

#### Scenario: All orders pre-selected including flagged

- **WHEN** the 確認訂單 step is displayed after scanning
- **THEN** ALL parsed orders SHALL be pre-selected (checked) by default, including those with `flagged_for_review = true`

#### Scenario: User cancels import and returns to list mode

- **WHEN** a user clicks 取消 on the 選擇日期 step or ← 返回 on the 確認訂單 step
- **THEN** the modal SHALL switch back to list mode without importing any orders

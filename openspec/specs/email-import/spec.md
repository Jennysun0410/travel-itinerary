### Requirement: Connect email account via OAuth
A user SHALL be able to connect their Gmail or Outlook account using OAuth 2.0. The app SHALL request only read-only email scope.

#### Scenario: Successful Gmail connection
- **WHEN** a user initiates Gmail connection and completes the OAuth consent screen
- **THEN** the system stores the OAuth tokens encrypted and begins monitoring for booking confirmation emails

#### Scenario: User revokes access
- **WHEN** a user disconnects their email account from the app settings
- **THEN** the stored OAuth tokens are deleted and no further emails are processed

### Requirement: Automatic detection of booking confirmation emails
The system SHALL automatically detect booking confirmation emails from connected accounts by filtering on known vendor senders and subject line patterns. Detection SHALL occur within 5 minutes of email arrival.

#### Scenario: Confirmation email detected
- **WHEN** a booking confirmation email arrives in a connected inbox
- **THEN** the system SHALL enqueue it for parsing within 5 minutes

#### Scenario: Non-booking email is ignored
- **WHEN** a regular email (not a booking confirmation) arrives
- **THEN** the system SHALL NOT create an order from it

### Requirement: Parse order details from email
The system SHALL extract structured order fields from detected booking confirmation emails using a rule-based parser. Extracted fields SHALL include: vendor name, booking reference, order type (flight/accommodation/activity), start datetime, end datetime, price, and currency. When invoked via the Gmail date-range scan flow, the parser SHALL return a ParsedOrder result without writing to the database. When invoked via Gmail push notification, the parser SHALL insert the order with trip_id = NULL.

#### Scenario: Successful parse via push notification

- **WHEN** a booking confirmation email is processed via Gmail push notification
- **THEN** the system SHALL create an order with trip_id = NULL and associate it with the user

#### Scenario: Successful parse via preview endpoint

- **WHEN** parseEmail is called from the preview flow
- **THEN** the system SHALL return a ParsedOrder object and SHALL NOT insert any database record

#### Scenario: Parse confidence below threshold

- **WHEN** extracted fields are incomplete or ambiguous
- **THEN** the system SHALL set flagged_for_review = true on the returned ParsedOrder

### Requirement: Manual correction of parsed fields
A user SHALL be able to edit any field of a parsed order to correct extraction errors.

#### Scenario: User corrects a field
- **WHEN** a user edits a parsed field and saves
- **THEN** the corrected value is stored and the order is no longer flagged for review

### Requirement: Assign unassigned orders to a trip
A user SHALL be able to assign an unassigned order to any trip they are a member of.

#### Scenario: Assign to trip
- **WHEN** a user selects a trip from the assignment dropdown on an unassigned order
- **THEN** the order is moved to that trip's order pool

## Requirements

### Requirement: Connect email account via OAuth
A user SHALL be able to connect their Gmail or Outlook account using OAuth 2.0. The app SHALL request only read-only email scope.

#### Scenario: Successful Gmail connection
- **WHEN** a user initiates Gmail connection and completes the OAuth consent screen
- **THEN** the system stores the OAuth tokens encrypted and begins monitoring for booking confirmation emails

#### Scenario: User revokes access
- **WHEN** a user disconnects their email account from the app settings
- **THEN** the stored OAuth tokens are deleted and no further emails are processed

---
### Requirement: Automatic detection of booking confirmation emails
The system SHALL automatically detect booking confirmation emails from connected accounts by filtering on known vendor senders and subject line patterns. Detection SHALL occur within 5 minutes of email arrival.

#### Scenario: Confirmation email detected
- **WHEN** a booking confirmation email arrives in a connected inbox
- **THEN** the system SHALL enqueue it for parsing within 5 minutes

#### Scenario: Non-booking email is ignored
- **WHEN** a regular email (not a booking confirmation) arrives
- **THEN** the system SHALL NOT create an order from it

---
### Requirement: Parse order details from email
The system SHALL extract structured order fields from detected booking confirmation emails using a rule-based parser. Extracted fields SHALL include: vendor name, booking reference, order type (flight/accommodation/activity), start datetime, end datetime, price, and currency. When invoked via the Gmail date-range scan flow, the parser SHALL return a ParsedOrder result without writing to the database. When invoked via Gmail push notification, the parser SHALL insert the order with trip_id = NULL.

#### Scenario: Successful parse via push notification

- **WHEN** a booking confirmation email is processed via Gmail push notification
- **THEN** the system SHALL create an order with trip_id = NULL and associate it with the user

#### Scenario: Successful parse via preview endpoint

- **WHEN** parseEmail is called from the preview flow
- **THEN** the system SHALL return a ParsedOrder object and SHALL NOT insert any database record

#### Scenario: Parse confidence below threshold

- **WHEN** extracted fields are incomplete or ambiguous
- **THEN** the system SHALL set flagged_for_review = true on the returned ParsedOrder

---
### Requirement: Manual correction of parsed fields
A user SHALL be able to edit any field of a parsed order to correct extraction errors.

#### Scenario: User corrects a field
- **WHEN** a user edits a parsed field and saves
- **THEN** the corrected value is stored and the order is no longer flagged for review

---
### Requirement: Assign unassigned orders to a trip
A user SHALL be able to assign an unassigned order to any trip they are a member of.

#### Scenario: Assign to trip
- **WHEN** a user selects a trip from the assignment dropdown on an unassigned order
- **THEN** the order is moved to that trip's order pool

## MODIFIED Requirements

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

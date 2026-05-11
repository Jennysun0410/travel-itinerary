## ADDED Requirements

### Requirement: Gmail sender-domain-based search query

The Gmail scan query SHALL use sender domain as the primary filter combined with subject keyword fallback.

The query structure SHALL be:
```
(from:(agoda.com OR booking.com OR airbnb.com OR klook.com OR trip.com OR evaair.com OR china-airlines.com OR flyscoot.com OR airasia.com OR tigerairtw.com OR flypeach.com) OR subject:(confirmation OR 確認 OR 預訂 OR 訂單 OR itinerary OR e-ticket OR booking)) after:YYYY/MM/DD before:YYYY/MM/DD
```

#### Scenario: Known platform email is matched by domain
- **GIVEN** a date range scan is triggered
- **WHEN** the user has an Agoda booking confirmation email in their inbox
- **THEN** the email SHALL be matched via `from:agoda.com` regardless of the email subject

#### Scenario: Unknown platform email is matched by subject fallback
- **GIVEN** a date range scan is triggered
- **WHEN** the user has a booking email from an unlisted sender domain with subject containing "確認"
- **THEN** the email SHALL be matched via the subject fallback clause

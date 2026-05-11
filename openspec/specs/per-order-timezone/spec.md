## ADDED Requirements

### Requirement: Timeline resolves timezone per order using destination periods

The Timeline view SHALL determine the display timezone for each order by calling `resolveTimezone(bookingDate, destinations)`:
1. If `bookingDate` is null, return the browser's local timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
2. Sort destinations by `startDate` ascending.
3. Return the `timezone` of the first destination whose `startDate <= bookingDate <= endDate`.
4. If no destination period matches, return the browser's local timezone.

#### Scenario: Order date falls within Tokyo period

- **WHEN** destinations = [{ timezone: "Asia/Tokyo", startDate: "2026-04-01", endDate: "2026-04-05" }, { timezone: "Asia/Hong_Kong", startDate: "2026-04-05", endDate: "2026-04-10" }] and `bookingDate = "2026-04-03"`
- **THEN** `resolveTimezone` returns `"Asia/Tokyo"`

#### Scenario: Order date on boundary matches first destination

- **WHEN** destinations share a boundary date and `bookingDate = "2026-04-05"`
- **THEN** `resolveTimezone` returns the timezone of the first matching destination in sorted order

#### Scenario: No booking date falls back to browser timezone

- **WHEN** `bookingDate` is null
- **THEN** `resolveTimezone` returns the browser's IANA timezone string

#### Scenario: Order date outside all destination periods

- **WHEN** `bookingDate = "2026-03-15"` and all destinations start on 2026-04-01 or later
- **THEN** `resolveTimezone` returns the browser's IANA timezone string

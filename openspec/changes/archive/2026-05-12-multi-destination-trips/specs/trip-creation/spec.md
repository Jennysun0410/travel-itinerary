## MODIFIED Requirements

### Requirement: Trip creation accepts destinations array

The POST /trips endpoint SHALL accept a request body with `name` (string, required) and `destinations` (array, required, may be empty). The endpoint SHALL NOT accept `start_date`, `end_date`, or `destination` as top-level fields from the client. The API SHALL compute `start_date`, `end_date`, and `destination` internally from the destinations array before inserting.

Validation: if `destinations` contains any entry missing `name`, `timezone`, `startDate`, or `endDate`, the API SHALL return 400 with `error: "validation_error"`.

#### Scenario: Valid request with destinations

- **WHEN** POST /trips receives `{ "name": "東亞之旅", "destinations": [{ "name": "東京", "timezone": "Asia/Tokyo", "startDate": "2026-04-01", "endDate": "2026-04-05" }] }`
- **THEN** the API returns 201 with the created trip including `start_date: "2026-04-01"` and `end_date: "2026-04-05"`

#### Scenario: Request with missing destination fields

- **WHEN** POST /trips receives a destination entry missing the `timezone` field
- **THEN** the API returns 400 with `error: "validation_error"`

#### Scenario: Request with empty destinations array

- **WHEN** POST /trips receives `{ "name": "Unnamed Trip", "destinations": [] }`
- **THEN** the API returns 201 with `start_date: null`, `end_date: null`, and `destinations: []`

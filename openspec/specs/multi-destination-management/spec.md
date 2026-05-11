## ADDED Requirements

### Requirement: Trip stores multiple destinations with date ranges

Each trip SHALL store zero or more destinations as a JSONB array on the `destinations` column. Each destination object SHALL contain: `name` (string), `timezone` (IANA timezone string), `startDate` (ISO date string YYYY-MM-DD), `endDate` (ISO date string YYYY-MM-DD).

The API SHALL derive `start_date` from the minimum `startDate` across all destinations and `end_date` from the maximum `endDate` across all destinations when creating a trip.

#### Scenario: Create trip with two destinations

- **WHEN** POST /trips receives `{ name: "東亞之旅", destinations: [{ name: "東京", timezone: "Asia/Tokyo", startDate: "2026-04-01", endDate: "2026-04-05" }, { name: "香港", timezone: "Asia/Hong_Kong", startDate: "2026-04-05", endDate: "2026-04-10" }] }`
- **THEN** the API creates the trip with `start_date = "2026-04-01"`, `end_date = "2026-04-10"`, `destination = "東京"` (first destination name), and `destinations` JSONB containing both entries

#### Scenario: Create trip with no destinations

- **WHEN** POST /trips receives `{ name: "My Trip", destinations: [] }`
- **THEN** the API creates the trip with `start_date = null`, `end_date = null`, and an empty destinations array

### Requirement: Frontend city dropdown with Chinese labels

The New Trip form SHALL present a city selector dropdown for each destination row showing Chinese city names. Each option SHALL map to an IANA timezone. The available cities SHALL include at minimum: 香港 (Asia/Hong_Kong), 東京 (Asia/Tokyo), 台北 (Asia/Taipei), 新加坡 (Asia/Singapore), 曼谷 (Asia/Bangkok), 首爾 (Asia/Seoul), 倫敦 (Europe/London), 巴黎 (Europe/Paris), 柏林 (Europe/Berlin), 紐約 (America/New_York), 洛杉磯 (America/Los_Angeles), 雪梨 (Australia/Sydney), 其他 (browser timezone).

#### Scenario: User selects Hong Kong

- **WHEN** user selects "香港" from the city dropdown
- **THEN** the destination entry stores `timezone: "Asia/Hong_Kong"` and displays "香港" as the label

### Requirement: New Trip form is centered

The New Trip page SHALL center its form content horizontally on the page with a maximum width of 480px and `margin: 0 auto`.

#### Scenario: Form appears centered on wide screen

- **WHEN** user opens the New Trip page on a screen wider than 480px
- **THEN** the form is horizontally centered with empty space on both sides

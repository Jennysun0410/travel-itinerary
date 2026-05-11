## ADDED Requirements

### Requirement: Flagged orders SHALL display a "待確認" badge in the Orders list

Orders with `flagged_for_review = true` SHALL display an orange "待確認" badge next to the vendor name in the Orders list page.

### Requirement: User can confirm a flagged order

A user SHALL be able to confirm a flagged order by clicking the "待確認" badge. Upon click, the frontend SHALL call `PATCH /orders/:id/confirm`. The API SHALL set `flagged_for_review = false` for that order. The badge SHALL disappear from the UI after confirmation.

The `PATCH /orders/:id/confirm` endpoint SHALL require authentication and SHALL only allow the order's creator to confirm it.

#### Scenario: Flagged order shows badge
- **GIVEN** an order with `flagged_for_review = true` exists in the trip
- **WHEN** the user views the Orders page
- **THEN** an orange "待確認" badge SHALL appear next to that order's vendor name

#### Scenario: User confirms flagged order
- **GIVEN** an order with `flagged_for_review = true`
- **WHEN** the user clicks the "待確認" badge
- **THEN** `PATCH /orders/:id/confirm` is called, `flagged_for_review` is set to `false`, and the badge disappears

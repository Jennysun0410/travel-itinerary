## MODIFIED Requirements

### Requirement: View all orders in a trip

All trip members SHALL be able to view the complete list of orders for a trip, filtered by type (all, flights, accommodations, activities). Orders SHALL be sorted by creation time (newest first).

#### Scenario: Default sort is newest first

- **WHEN** a trip member opens the orders management page
- **THEN** they SHALL see all orders for the trip sorted by `created_at` descending (newest first)

#### Scenario: Filter by order type

- **WHEN** a member selects a filter (e.g., "Flights")
- **THEN** only orders of that type are displayed, still sorted by creation time (newest first)

## ADDED Requirements

### Requirement: Add orders modal entry point

The web Orders page SHALL provide a single `[+ 加入行程]` button as the only entry point for adding orders to a trip. Clicking it opens the "Add orders" modal overlay. The page SHALL NOT display separate manual-add, email-import, or demo buttons.

#### Scenario: Modal opens in list mode

- **WHEN** a user clicks `[+ 加入行程]`
- **THEN** the modal SHALL open showing the current order list and an `[import from mail]` button in the top-right of the inner card

#### Scenario: Modal closes after successful import

- **WHEN** the Gmail import flow inside the modal reaches the 加入成功 step and the user clicks 完成
- **THEN** the modal SHALL close and the Orders page SHALL reload displaying orders sorted by creation time (newest first)

### Requirement: View all orders in a trip
All trip members SHALL be able to view the complete list of orders for a trip, filtered by type (all, flights, accommodations, activities).

#### Scenario: View all orders
- **WHEN** a trip member opens the orders management page
- **THEN** they SHALL see all orders for the trip sorted by start datetime

#### Scenario: Filter by order type
- **WHEN** a member selects a filter (e.g., "Flights")
- **THEN** only orders of that type are displayed

### Requirement: Manually add an order
Any trip member SHALL be able to manually add an order to a trip by entering the order fields directly, without requiring an email import.

#### Scenario: Manual order creation
- **WHEN** a member fills in the order form (type, vendor, dates, price) and submits
- **THEN** a new order is added to the trip's order pool attributed to that member

### Requirement: Edit an order
Any trip member SHALL be able to edit the fields of any order within the trip.

#### Scenario: Edit order fields
- **WHEN** a member updates order fields and saves
- **THEN** the order reflects the updated values and records the last-modified user and timestamp

### Requirement: Delete an order
Any trip member SHALL be able to delete an order. Deleting an order that is placed on the timeline SHALL also remove its corresponding timeline slot.

#### Scenario: Delete order not on timeline
- **WHEN** a member deletes an order that has no timeline slot
- **THEN** the order is permanently removed

#### Scenario: Delete order on timeline
- **WHEN** a member deletes an order that is placed on the timeline
- **THEN** the order AND its timeline slot are both permanently removed

### Requirement: Display order attribution
Each order SHALL display the name of the trip member who added it (either via email import or manual entry).

#### Scenario: Attribution shown in order list
- **WHEN** a member views the order list
- **THEN** each order SHALL show the display name of the member who created it

## Requirements

### Requirement: View all orders in a trip

All trip members SHALL be able to view the complete list of orders for a trip, filtered by type (all, flights, accommodations, activities). Orders SHALL be sorted by creation time (newest first).

#### Scenario: Default sort is newest first

- **WHEN** a trip member opens the orders management page
- **THEN** they SHALL see all orders for the trip sorted by `created_at` descending (newest first)

#### Scenario: Filter by order type

- **WHEN** a member selects a filter (e.g., "Flights")
- **THEN** only orders of that type are displayed, still sorted by creation time (newest first)

---
### Requirement: Manually add an order
Any trip member SHALL be able to manually add an order to a trip by entering the order fields directly, without requiring an email import.

#### Scenario: Manual order creation
- **WHEN** a member fills in the order form (type, vendor, dates, price) and submits
- **THEN** a new order is added to the trip's order pool attributed to that member

---
### Requirement: Edit an order
Any trip member SHALL be able to edit the fields of any order within the trip.

#### Scenario: Edit order fields
- **WHEN** a member updates order fields and saves
- **THEN** the order reflects the updated values and records the last-modified user and timestamp

---
### Requirement: Delete an order
Any trip member SHALL be able to delete an order. Deleting an order that is placed on the timeline SHALL also remove its corresponding timeline slot.

#### Scenario: Delete order not on timeline
- **WHEN** a member deletes an order that has no timeline slot
- **THEN** the order is permanently removed

#### Scenario: Delete order on timeline
- **WHEN** a member deletes an order that is placed on the timeline
- **THEN** the order AND its timeline slot are both permanently removed

---
### Requirement: Display order attribution
Each order SHALL display the name of the trip member who added it (either via email import or manual entry).

#### Scenario: Attribution shown in order list
- **WHEN** a member views the order list
- **THEN** each order SHALL show the display name of the member who created it

---
### Requirement: Add orders modal entry point

The web Orders page SHALL provide a single `[+ 加入行程]` button as the only entry point for adding orders to a trip. Clicking it opens the "Add orders" modal overlay. The page SHALL NOT display separate manual-add, email-import, or demo buttons.

#### Scenario: Modal opens in list mode

- **WHEN** a user clicks `[+ 加入行程]`
- **THEN** the modal SHALL open showing the current order list and an `[import from mail]` button in the top-right of the inner card

#### Scenario: Modal closes after successful import

- **WHEN** the Gmail import flow inside the modal reaches the 加入成功 step and the user clicks 完成
- **THEN** the modal SHALL close and the Orders page SHALL reload displaying orders sorted by creation time (newest first)

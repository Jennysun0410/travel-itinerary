### Requirement: View day-by-day timeline
All trip members SHALL be able to view a day-by-day timeline spanning the trip's start and end dates, displaying all orders that have been placed on each day.

#### Scenario: Timeline displays trip duration
- **WHEN** a member opens the itinerary timeline
- **THEN** the timeline SHALL show one column or section per day from trip start to trip end

#### Scenario: Placed orders appear on their assigned day
- **WHEN** an order has been placed on a specific day
- **THEN** it SHALL appear within that day's section in the timeline

### Requirement: Drag order from pool to timeline
Any trip member SHALL be able to drag an unscheduled order from the order pool panel and drop it onto a specific day in the timeline. This creates a timeline slot for that order.

#### Scenario: Drag order onto a day
- **WHEN** a member drags an order from the pool and drops it on a day
- **THEN** a timeline slot is created for that order on that day, and the order is removed from the unscheduled pool display

#### Scenario: Order already on timeline cannot be double-placed
- **WHEN** a member attempts to drag an order that already has a timeline slot
- **THEN** the system SHALL prevent the action and display an informational message

### Requirement: Reorder items within a day
Any trip member SHALL be able to reorder items within a day on the timeline by dragging them up or down.

#### Scenario: Reorder within a day
- **WHEN** a member drags a timeline slot to a new position within the same day
- **THEN** the position order is updated and persisted

### Requirement: Move order to a different day
Any trip member SHALL be able to move an order from one day to another by dragging it across day sections on the timeline.

#### Scenario: Move to different day
- **WHEN** a member drags a timeline slot from one day and drops it on a different day
- **THEN** the slot's date is updated to the new day and the order appears under the new day

### Requirement: Remove order from timeline
Any trip member SHALL be able to remove an order from the timeline, returning it to the unscheduled order pool. The order itself SHALL NOT be deleted.

#### Scenario: Remove from timeline
- **WHEN** a member removes an order from the timeline
- **THEN** the timeline slot is deleted and the order reappears in the order pool

### Requirement: Display collaborator attribution on timeline slots
Each timeline slot SHALL display the name of the trip member who placed it on the timeline.

#### Scenario: Attribution shown on slot
- **WHEN** a member views the timeline
- **THEN** each slot SHALL show the display name of the member who placed it

## Requirements

### Requirement: View day-by-day timeline
All trip members SHALL be able to view a day-by-day timeline spanning the trip's start and end dates, displaying all orders that have been placed on each day.

#### Scenario: Timeline displays trip duration
- **WHEN** a member opens the itinerary timeline
- **THEN** the timeline SHALL show one column or section per day from trip start to trip end

#### Scenario: Placed orders appear on their assigned day
- **WHEN** an order has been placed on a specific day
- **THEN** it SHALL appear within that day's section in the timeline

---
### Requirement: Drag order from pool to timeline
Any trip member SHALL be able to drag an unscheduled order from the order pool panel and drop it onto a specific day in the timeline. This creates a timeline slot for that order.

#### Scenario: Drag order onto a day
- **WHEN** a member drags an order from the pool and drops it on a day
- **THEN** a timeline slot is created for that order on that day, and the order is removed from the unscheduled pool display

#### Scenario: Order already on timeline cannot be double-placed
- **WHEN** a member attempts to drag an order that already has a timeline slot
- **THEN** the system SHALL prevent the action and display an informational message

---
### Requirement: Reorder items within a day
Any trip member SHALL be able to reorder items within a day on the timeline by dragging them up or down.

#### Scenario: Reorder within a day
- **WHEN** a member drags a timeline slot to a new position within the same day
- **THEN** the position order is updated and persisted

---
### Requirement: Move order to a different day
Any trip member SHALL be able to move an order from one day to another by dragging it across day sections on the timeline.

#### Scenario: Move to different day
- **WHEN** a member drags a timeline slot from one day and drops it on a different day
- **THEN** the slot's date is updated to the new day and the order appears under the new day

---
### Requirement: Remove order from timeline
Any trip member SHALL be able to remove an order from the timeline, returning it to the unscheduled order pool. The order itself SHALL NOT be deleted.

#### Scenario: Remove from timeline
- **WHEN** a member removes an order from the timeline
- **THEN** the timeline slot is deleted and the order reappears in the order pool

---
### Requirement: Display collaborator attribution on timeline slots
Each timeline slot SHALL display the name of the trip member who placed it on the timeline.

#### Scenario: Attribution shown on slot
- **WHEN** a member views the timeline
- **THEN** each slot SHALL show the display name of the member who placed it

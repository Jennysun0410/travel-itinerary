## ADDED Requirements

### Requirement: Create a trip
A user SHALL be able to create a new trip by providing a name, destination, start date, and end date.

#### Scenario: Successful trip creation
- **WHEN** an authenticated user submits a valid trip name, destination, start date, and end date
- **THEN** a new trip is created and the user is set as the owner

#### Scenario: Invalid date range rejected
- **WHEN** a user submits a trip with an end date earlier than the start date
- **THEN** the system SHALL reject the request with a validation error

##### Example: date validation
| Start Date | End Date   | Result                          |
|------------|------------|---------------------------------|
| 2026-07-10 | 2026-07-15 | Trip created successfully       |
| 2026-07-15 | 2026-07-10 | Error: end date before start    |
| 2026-07-10 | 2026-07-10 | Trip created (single-day trip)  |

### Requirement: Invite collaborators
The trip owner SHALL be able to invite other users to a trip by email address. Invited users become collaborators with read and write access to the trip's orders and timeline.

#### Scenario: Invite by email
- **WHEN** the trip owner provides a valid email address and sends an invitation
- **THEN** an invitation is sent to that email and the recipient can accept to join as a collaborator

#### Scenario: Inviting an existing member is rejected
- **WHEN** the owner tries to invite a user who is already a member of the trip
- **THEN** the system SHALL reject the request with an error indicating the user is already a member

### Requirement: View trip members
All trip members SHALL be able to view the full list of collaborators for a trip, including their display name and role (owner or collaborator).

#### Scenario: Member list visible to all members
- **WHEN** any trip member opens the trip
- **THEN** they SHALL see the complete list of members with their roles

### Requirement: Remove a collaborator
The trip owner SHALL be able to remove a collaborator from the trip. The removed user SHALL lose all access to the trip immediately.

#### Scenario: Owner removes a collaborator
- **WHEN** the trip owner removes a collaborator
- **THEN** that user SHALL no longer be able to view or edit the trip

### Requirement: Delete a trip
The trip owner SHALL be able to delete a trip. Deletion removes all associated orders and timeline slots.

#### Scenario: Owner deletes a trip
- **WHEN** the trip owner confirms deletion
- **THEN** the trip, all its orders, and all timeline slots are permanently deleted

## Why

Travelers often compare prices across multiple booking platforms (flights on one site, hotels on another, tickets on Klook, etc.) and end up with purchase confirmations scattered across different emails and apps. There is no unified place to view all bookings for a single trip, making pre-trip planning fragmented and error-prone.

## What Changes

- Users can connect Gmail or Outlook via OAuth to enable automatic booking detection
- Booking confirmation emails are parsed and extracted into structured order records
- Orders are organized under a "Trip" container (like a folder) with sub-categories: flights, accommodations, activities
- Users can create a trip and invite travel companions who can view and add their own orders
- A drag-and-drop timeline view lets users manually schedule orders into a day-by-day itinerary
- An orders management page serves as a pool of all imported orders for a trip
- Available on both web and mobile

## Non-Goals (optional)

- Price comparison or booking initiation — the app does not search or compare prices; it only integrates after purchase
- Automatic itinerary scheduling (AI-generated day plans) — ordering is manual drag-and-drop only
- Direct API integration with booking platforms (Booking.com, Agoda, Klook) — email parsing is the sole data source

## Capabilities

### New Capabilities

- `trip-management`: Create and manage trip containers that group all bookings for a single journey; invite and collaborate with travel companions
- `email-import`: Connect Gmail/Outlook via OAuth and automatically parse booking confirmation emails into structured order records
- `order-management`: View, categorize, and manage all imported orders (flights, accommodations, activities) for a trip
- `itinerary-timeline`: Drag-and-drop interface to schedule orders onto a day-by-day timeline view

### Modified Capabilities

(none)

## Impact

- Affected specs: trip-management, email-import, order-management, itinerary-timeline
- Affected code:
  - New: src/app/ (Next.js web app)
  - New: src/mobile/ (React Native mobile app)
  - New: src/server/ (API server — auth, trip, order, email parsing)
  - New: src/shared/ (shared types and utilities)

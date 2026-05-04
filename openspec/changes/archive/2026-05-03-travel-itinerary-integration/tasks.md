## 1. Project Setup

- [x] 1.1 Initialize monorepo structure with packages: api, web, mobile, shared
- [x] 1.2 Configure shared TypeScript types package (Trip, Order, TimelineSlot, User)
- [x] 1.3 Set up PostgreSQL schema for Data Model: Trip → Orders → Timeline Slots (tables: users, trips, trip_members, orders, timeline_slots, email_connections)
- [x] 1.4 Configure environment variables for OAuth credentials, database URL, and Claude API key

## 2. Authentication — Stack: Next.js (web) + React Native (mobile) + Node.js API — Authentication: OAuth-first (Google + Apple Sign-In)

- [x] 2.1 Implement Google OAuth 2.0 sign-in on API server (JWT session tokens)
- [x] 2.2 Implement Apple Sign-In on API server
- [x] 2.3 Add auth middleware to API routes
- [x] 2.4 Implement sign-in screens on web (Next.js) and mobile (React Native)

## 3. Trip Management

- [x] 3.1 Implement POST /trips endpoint — create a trip (name, destination, start_date, end_date); enforce date validation (end >= start) per "create a trip" requirement
- [x] 3.2 Implement GET /trips endpoint — list trips for the authenticated user
- [x] 3.3 Implement DELETE /trips/:id endpoint — delete trip and cascade-delete orders and timeline slots per "delete a trip" requirement
- [x] 3.4 Implement POST /trips/:id/invitations — invite collaborator by email per "invite collaborators" requirement; reject if already a member
- [x] 3.5 Implement POST /invitations/:token/accept — accept trip invitation, add user as collaborator
- [x] 3.6 Implement DELETE /trips/:id/members/:userId — owner removes a collaborator per "remove a collaborator" requirement
- [x] 3.7 Implement GET /trips/:id/members — list all trip members with roles per "view trip members" requirement
- [x] 3.8 Build trip creation and management UI (web + mobile)
- [x] 3.9 Build member list and invitation UI (web + mobile)

## 4. Email Import — Email Parsing: Gmail API + Outlook Graph API via OAuth 2.0

- [x] 4.1 Implement Gmail OAuth 2.0 connection flow; store encrypted tokens per "connect email account via OAuth" requirement
- [x] 4.2 Implement Outlook OAuth connection flow; store encrypted tokens
- [x] 4.3 Set up Gmail push notifications (PubSub) for new email detection per "automatic detection of booking confirmation emails" requirement (≤5 min latency)
- [x] 4.4 Set up Outlook webhook subscription for new email detection
- [x] 4.5 Implement email pre-filter: match known vendor senders and booking-related subject keywords before forwarding to parser
- [x] 4.6 Implement Claude API extraction — send email HTML/text with structured output schema; extract vendor, booking_ref, type, start_datetime, end_datetime, price, currency per "parse order details from email" requirement
- [x] 4.7 Handle low-confidence parse results: create draft order with available fields and flag for manual review per "parse confidence below threshold" scenario
- [x] 4.8 Implement DELETE /email-connections/:id — disconnect email account, delete tokens per "user revokes access" scenario
- [x] 4.9 Build email connection management UI (web + mobile)
- [x] 4.10 Build parsed order review UI — highlight flagged fields needing correction per "manual correction of parsed fields" requirement
- [x] 4.11 Implement PATCH /orders/unassigned/:id/assign — assign unassigned order to a trip per "assign unassigned orders to a trip" requirement; build assignment UI (web + mobile)

## 5. Order Management

- [x] 5.1 Implement GET /trips/:id/orders — list all orders; support type filter query param per "view all orders in a trip" requirement
- [x] 5.2 Implement POST /trips/:id/orders — manually add an order per "manually add an order" requirement
- [x] 5.3 Implement PATCH /orders/:id — edit order fields; record last_modified_by and timestamp per "edit an order" requirement
- [x] 5.4 Implement DELETE /orders/:id — delete order; cascade-delete timeline slot if present per "delete an order" requirement
- [x] 5.5 Include created_by user display name in all order API responses per "display order attribution" requirement
- [x] 5.6 Build orders management page UI — list with type filter tabs, add/edit/delete actions (web + mobile)

## 6. Itinerary Timeline

- [x] 6.1 Implement GET /trips/:id/timeline — return all timeline slots grouped by day per "view day-by-day timeline" requirement
- [x] 6.2 Implement POST /trips/:id/timeline — create a timeline slot (order_id, day, position); reject if order already has a slot per "drag order from pool to timeline" and "order already on timeline cannot be double-placed" requirements
- [x] 6.3 Implement PATCH /timeline/:id — update slot's day and/or position per "reorder items within a day" and "move order to a different day" requirements
- [x] 6.4 Implement DELETE /timeline/:id — remove slot (keep order intact) per "remove order from timeline" requirement
- [x] 6.5 Include placed_by user display name in timeline slot API responses per "display collaborator attribution on timeline slots" requirement
- [x] 6.6 Build itinerary timeline UI with day columns and drag-and-drop for placing orders (web — use react-dnd or dnd-kit)
- [x] 6.7 Build itinerary timeline UI for mobile (React Native — use react-native-draggable-flatlist)
- [x] 6.8 Implement optimistic UI updates on drag-and-drop with server reconciliation per "Real-time Collaboration: Polling + Optimistic UI" design decision
- [x] 6.9 Implement 5-second polling for timeline sync across collaborators

## 7. Shared Utilities and Quality

- [x] 7.1 Store all datetimes in UTC with explicit timezone offset; display in local time per destination per "Multi-timezone trips" risk mitigation
- [x] 7.2 Implement per-user rate limiting on email parse jobs per "Email volume / rate limits" risk mitigation
- [x] 7.3 Add end-to-end tests covering the critical path: connect email → parse order → assign to trip → place on timeline

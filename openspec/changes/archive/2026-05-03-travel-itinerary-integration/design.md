## Context

Travelers use multiple booking platforms (airlines, Booking.com, Agoda, Klook, etc.) to find the best prices. The result is a set of purchase confirmation emails scattered across their inbox, with no unified view of a complete trip. This app solves the aggregation problem by parsing those emails automatically and providing a collaborative, drag-and-drop itinerary tool.

There is no existing codebase — this is a greenfield product.

## Goals / Non-Goals

**Goals:**

- Automatically ingest booking confirmation emails via Gmail/Outlook OAuth
- Organize orders under a Trip container with typed categories (flight, accommodation, activity)
- Allow multiple collaborators to contribute orders to the same trip
- Provide a drag-and-drop timeline view to arrange orders day-by-day
- Deliver both web and mobile clients from a shared API

**Non-Goals:**

- Price comparison or external booking search
- AI-generated itinerary suggestions or automatic scheduling
- Direct API integrations with Booking.com, Agoda, Klook, or any airline
- Offline mode or local-only storage
- Payment or booking functionality within the app

## Decisions

### Stack: Next.js (web) + React Native (mobile) + Node.js API

Both web and mobile share a single REST/GraphQL API. Next.js is used for the web client (SSR-friendly, good for auth flows). React Native shares component logic and type definitions with the web via a shared package.

Alternatives considered:
- Flutter: strong mobile story but weaker web and less JS ecosystem overlap
- Separate web/mobile backends: rejected — duplicates business logic

### Email Parsing: Gmail API + Outlook Graph API via OAuth 2.0

Users grant read-only email scope. The server polls or uses push notifications (Gmail PubSub / Outlook webhooks) to detect new confirmation emails. An LLM-assisted extraction layer (Claude API) parses unstructured email HTML/text into structured order fields (booking reference, dates, vendor, price, category).

Alternatives considered:
- Regex/rule-based parsing only: too brittle across hundreds of vendor email formats
- User-forwarding to a dedicated inbox: simpler but worse UX, no automatic sync

### Data Model: Trip → Orders → Timeline Slots

```
Trip
  id, name, destination, start_date, end_date
  members[] → User (owner | collaborator)

Order
  id, trip_id, created_by (user_id)
  type: flight | accommodation | activity
  raw_email_id, vendor, booking_ref
  start_datetime, end_datetime, price, currency
  status: confirmed | cancelled | pending

TimelineSlot
  id, trip_id, order_id
  day (date), position (integer, for ordering within a day)
```

An order exists independently of the timeline; placing it on the timeline creates a TimelineSlot. Removing from the timeline deletes the slot but keeps the order.

### Real-time Collaboration: Polling + Optimistic UI

For MVP, use short-interval polling (5s) for timeline sync across collaborators. Optimistic UI updates locally on drag-and-drop, then reconciles with server response.

Alternatives considered:
- WebSockets: better real-time, but adds infra complexity for MVP
- CRDTs: overkill for this use case

### Authentication: OAuth-first (Google + Apple Sign-In)

Users sign in with Google or Apple. No email/password auth in MVP — reduces attack surface and simplifies the auth flow, since Gmail OAuth is already required for email parsing.

## Risks / Trade-offs

- **Email parsing accuracy** → Mitigation: Use LLM extraction with structured output schema; allow manual correction of parsed fields
- **OAuth scope sensitivity** → Mitigation: Request minimal scope (read-only), display clear consent language, store tokens encrypted at rest
- **Email volume / rate limits** → Mitigation: Filter emails by label/subject heuristics before full parse; implement per-user rate limiting on parse jobs
- **Multi-timezone trips** → Mitigation: Store all datetimes in UTC with explicit timezone offset; display in local time based on destination
- **Collaborator conflicts on timeline** → Mitigation: Last-write-wins for MVP; show collaborator name on each slot to surface conflicts visually

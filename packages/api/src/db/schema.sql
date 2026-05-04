-- Travel Itinerary Integration — PostgreSQL Schema
-- Data Model: Trip → Orders → Timeline Slots

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url  TEXT,
  provider    TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_id TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_id)
);

-- Trips
CREATE TABLE trips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

-- Trip Members (owner is also a member with role 'owner')
CREATE TABLE trip_members (
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'collaborator')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

-- Trip Invitations
CREATE TABLE trip_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES users(id),
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Connections
CREATE TABLE email_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email        TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- Orders (unassigned if trip_id IS NULL)
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id          UUID REFERENCES trips(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES users(id),
  last_modified_by UUID REFERENCES users(id),
  last_modified_at TIMESTAMPTZ,
  type             TEXT NOT NULL CHECK (type IN ('flight', 'accommodation', 'activity')),
  vendor           TEXT NOT NULL DEFAULT '',
  booking_ref      TEXT NOT NULL DEFAULT '',
  start_datetime   TIMESTAMPTZ NOT NULL,
  end_datetime     TIMESTAMPTZ NOT NULL,
  price            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'USD',
  status           TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'confirmed',
  raw_email_id     TEXT,
  flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timeline Slots
CREATE TABLE timeline_slots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  day        DATE NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  placed_by  UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_owner ON trips(owner_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
CREATE INDEX idx_orders_trip ON orders(trip_id);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_unassigned ON orders(created_by) WHERE trip_id IS NULL;
CREATE INDEX idx_timeline_slots_trip_day ON timeline_slots(trip_id, day);
CREATE INDEX idx_email_connections_user ON email_connections(user_id);

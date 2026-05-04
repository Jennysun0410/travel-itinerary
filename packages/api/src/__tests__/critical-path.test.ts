/**
 * End-to-end critical path tests:
 * connect email → parse order → assign to trip → place on timeline
 *
 * These tests hit a real test database. Set TEST_DATABASE_URL before running.
 * Run: DATABASE_URL=$TEST_DATABASE_URL jest critical-path
 */

import pool from '../db/client';
import { enqueueEmailForParsing } from '../email/parser';
import { checkParseRateLimit } from '../email/ratelimit';
import { encrypt, decrypt } from '../email/encryption';
import { signToken, verifyToken } from '../auth/jwt';

// ── helpers ──────────────────────────────────────────────────────────────────

async function createUser(email: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (email, display_name, provider, provider_id)
     VALUES ($1, $2, 'google', $1) RETURNING id`,
    [email, email.split('@')[0]],
  );
  return rows[0].id;
}

async function createTrip(ownerId: string): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO trips (name, destination, start_date, end_date, owner_id)
       VALUES ('Test Trip', 'Tokyo', '2026-07-10', '2026-07-15', $1) RETURNING id`,
      [ownerId],
    );
    const tripId = rows[0].id;
    await client.query(
      `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [tripId, ownerId],
    );
    await client.query('COMMIT');
    return tripId;
  } finally {
    client.release();
  }
}

// ── setup / teardown ─────────────────────────────────────────────────────────

let userId: string;
let tripId: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.ANTHROPIC_API_KEY = 'test';
  userId = await createUser(`e2e-${Date.now()}@test.com`);
  tripId = await createTrip(userId);
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  await pool.end();
});

// ── JWT ───────────────────────────────────────────────────────────────────────

describe('JWT auth', () => {
  it('signs and verifies a token', () => {
    const token = signToken({ userId, email: 'test@test.com' });
    const payload = verifyToken(token);
    expect(payload.userId).toBe(userId);
    expect(payload.email).toBe('test@test.com');
  });

  it('rejects a tampered token', () => {
    const token = signToken({ userId, email: 'test@test.com' });
    expect(() => verifyToken(token + 'x')).toThrow();
  });
});

// ── Encryption ────────────────────────────────────────────────────────────────

describe('Token encryption', () => {
  it('encrypts and decrypts a token', () => {
    const plaintext = 'my-secret-oauth-token';
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });
});

// ── Rate limiter ──────────────────────────────────────────────────────────────

describe('Parse rate limiter', () => {
  it('allows up to 20 parses per minute per user', () => {
    const testUserId = `rate-test-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      expect(checkParseRateLimit(testUserId).allowed).toBe(true);
    }
    expect(checkParseRateLimit(testUserId).allowed).toBe(false);
  });

  it('does not affect other users', () => {
    const userA = `rate-a-${Date.now()}`;
    const userB = `rate-b-${Date.now()}`;
    for (let i = 0; i < 20; i++) checkParseRateLimit(userA);
    expect(checkParseRateLimit(userA).allowed).toBe(false);
    expect(checkParseRateLimit(userB).allowed).toBe(true);
  });
});

// ── Email parse → order ────────────────────────────────────────────────────────

describe('Email parse (mocked Claude API)', () => {
  beforeEach(() => {
    // Mock Anthropic to return a deterministic structured response
    jest.mock('@anthropic-ai/sdk', () => {
      return {
        default: class {
          messages = {
            create: async () => ({
              content: [{
                type: 'text',
                text: JSON.stringify({
                  type: 'flight',
                  vendor: 'EVA Air',
                  booking_ref: 'ABCDEF',
                  start_datetime: '2026-07-10T08:30:00+08:00',
                  end_datetime: '2026-07-10T13:45:00+09:00',
                  price: 8500,
                  currency: 'TWD',
                }),
              }],
            }),
          };
        },
      };
    });
  });

  it('creates an order from a booking email and skips duplicate email IDs', async () => {
    const emailId = `email-${Date.now()}`;
    const emailBody = `
      Your EVA Air booking is confirmed.
      Booking Reference: ABCDEF
      Departure: Jul 10 08:30 TPE → NRT
      Price: TWD 8,500
    `;

    await enqueueEmailForParsing(userId, emailId, emailBody);

    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE raw_email_id = $1`,
      [emailId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].created_by).toBe(userId);
    expect(rows[0].trip_id).toBeNull();

    // Idempotency: parsing same email twice should not create duplicate
    await enqueueEmailForParsing(userId, emailId, emailBody);
    const { rows: rows2 } = await pool.query(
      `SELECT * FROM orders WHERE raw_email_id = $1`,
      [emailId],
    );
    expect(rows2).toHaveLength(1);
  });
});

// ── Assign order to trip ──────────────────────────────────────────────────────

describe('Assign order to trip', () => {
  it('moves an unassigned order into a trip', async () => {
    const { rows: [order] } = await pool.query<{ id: string }>(
      `INSERT INTO orders (created_by, type, vendor, booking_ref, start_datetime, end_datetime)
       VALUES ($1, 'activity', 'Klook', 'KLK001', NOW(), NOW() + interval '2 hours')
       RETURNING id`,
      [userId],
    );

    await pool.query(
      `UPDATE orders SET trip_id = $1 WHERE id = $2`,
      [tripId, order.id],
    );

    const { rows: [updated] } = await pool.query(
      `SELECT trip_id FROM orders WHERE id = $1`,
      [order.id],
    );
    expect(updated.trip_id).toBe(tripId);
  });
});

// ── Place order on timeline ────────────────────────────────────────────────────

describe('Place order on timeline', () => {
  it('creates a timeline slot and prevents double-placing', async () => {
    const { rows: [order] } = await pool.query<{ id: string }>(
      `INSERT INTO orders (trip_id, created_by, type, vendor, booking_ref, start_datetime, end_datetime)
       VALUES ($1, $2, 'activity', 'DisneySea', 'DS001', NOW(), NOW() + interval '8 hours')
       RETURNING id`,
      [tripId, userId],
    );

    await pool.query(
      `INSERT INTO timeline_slots (trip_id, order_id, day, position, placed_by)
       VALUES ($1, $2, '2026-07-12', 0, $3)`,
      [tripId, order.id, userId],
    );

    const { rows } = await pool.query(
      `SELECT * FROM timeline_slots WHERE order_id = $1`,
      [order.id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].day.toISOString().slice(0, 10)).toBe('2026-07-12');

    // Attempting to insert a second slot for the same order should fail (UNIQUE constraint)
    await expect(
      pool.query(
        `INSERT INTO timeline_slots (trip_id, order_id, day, position, placed_by)
         VALUES ($1, $2, '2026-07-13', 0, $3)`,
        [tripId, order.id, userId],
      ),
    ).rejects.toThrow();
  });

  it('removes a timeline slot without deleting the order', async () => {
    const { rows: [order] } = await pool.query<{ id: string }>(
      `INSERT INTO orders (trip_id, created_by, type, vendor, booking_ref, start_datetime, end_datetime)
       VALUES ($1, $2, 'accommodation', 'Shinjuku Hotel', 'SH001', NOW(), NOW() + interval '5 days')
       RETURNING id`,
      [tripId, userId],
    );

    const { rows: [slot] } = await pool.query<{ id: string }>(
      `INSERT INTO timeline_slots (trip_id, order_id, day, position, placed_by)
       VALUES ($1, $2, '2026-07-10', 0, $3) RETURNING id`,
      [tripId, order.id, userId],
    );

    await pool.query(`DELETE FROM timeline_slots WHERE id = $1`, [slot.id]);

    const slotCheck = await pool.query(`SELECT 1 FROM timeline_slots WHERE id = $1`, [slot.id]);
    expect(slotCheck.rowCount).toBe(0);

    const orderCheck = await pool.query(`SELECT 1 FROM orders WHERE id = $1`, [order.id]);
    expect(orderCheck.rowCount).toBe(1);
  });
});

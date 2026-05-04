import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db/client';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

// POST /trips — create a trip
router.post('/', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { name, destination, start_date, end_date } = req.body as {
    name: string; destination: string; start_date: string; end_date: string;
  };

  if (!name || !destination || !start_date || !end_date) {
    res.status(400).json({ error: 'validation_error', message: 'name, destination, start_date, and end_date are required' });
    return;
  }
  if (new Date(end_date) < new Date(start_date)) {
    res.status(400).json({ error: 'validation_error', message: 'end_date must be on or after start_date' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO trips (name, destination, start_date, end_date, owner_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, destination, start_date, end_date, auth.userId],
    );
    const tripId = rows[0].id;
    await client.query(
      `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [tripId, auth.userId],
    );
    await client.query('COMMIT');

    const trip = await getTripById(tripId, auth.userId);
    res.status(201).json(trip);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /trips — list trips for authenticated user
router.get('/', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.destination, t.start_date, t.end_date, t.owner_id, t.created_at, t.updated_at
     FROM trips t
     JOIN trip_members tm ON tm.trip_id = t.id
     WHERE tm.user_id = $1
     ORDER BY t.start_date ASC`,
    [auth.userId],
  );
  res.json(rows);
});

// DELETE /trips/:id — delete trip (owner only)
router.delete('/:id', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id } = req.params;
  const { rowCount } = await pool.query(
    `DELETE FROM trips WHERE id = $1 AND owner_id = $2`,
    [id, auth.userId],
  );
  if (!rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Trip not found or you are not the owner' });
    return;
  }
  res.status(204).send();
});

// POST /trips/:id/invitations — invite collaborator by email
router.post('/:id/invitations', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id: tripId } = req.params;
  const { email } = req.body as { email: string };

  if (!email) {
    res.status(400).json({ error: 'validation_error', message: 'email is required' });
    return;
  }

  // Verify requester is owner
  const ownerCheck = await pool.query(
    `SELECT 1 FROM trips WHERE id = $1 AND owner_id = $2`,
    [tripId, auth.userId],
  );
  if (!ownerCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'Only the trip owner can invite members' });
    return;
  }

  // Reject if already a member
  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members tm JOIN users u ON u.id = tm.user_id
     WHERE tm.trip_id = $1 AND u.email = $2`,
    [tripId, email],
  );
  if (memberCheck.rowCount) {
    res.status(409).json({ error: 'already_member', message: 'User is already a member of this trip' });
    return;
  }

  const { rows } = await pool.query<{ id: string; token: string }>(
    `INSERT INTO trip_invitations (trip_id, invited_by, email)
     VALUES ($1, $2, $3) RETURNING id, token`,
    [tripId, auth.userId, email],
  );
  res.status(201).json({ invitationId: rows[0].id, token: rows[0].token });
});

// POST /invitations/:token/accept
router.post('/invitations/:token/accept', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { token } = req.params;

  const { rows } = await pool.query<{ id: string; trip_id: string; email: string; accepted_at: string | null }>(
    `SELECT id, trip_id, email, accepted_at FROM trip_invitations WHERE token = $1`,
    [token],
  );
  if (!rows.length) {
    res.status(404).json({ error: 'not_found', message: 'Invitation not found' });
    return;
  }
  const inv = rows[0];
  if (inv.accepted_at) {
    res.status(409).json({ error: 'already_accepted', message: 'Invitation already accepted' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1, $2, 'collaborator')
       ON CONFLICT DO NOTHING`,
      [inv.trip_id, auth.userId],
    );
    await client.query(
      `UPDATE trip_invitations SET accepted_at = NOW() WHERE id = $1`,
      [inv.id],
    );
    await client.query('COMMIT');
    res.json({ tripId: inv.trip_id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// DELETE /trips/:id/members/:userId — owner removes collaborator
router.delete('/:id/members/:userId', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id: tripId, userId: targetUserId } = req.params;

  const ownerCheck = await pool.query(
    `SELECT 1 FROM trips WHERE id = $1 AND owner_id = $2`,
    [tripId, auth.userId],
  );
  if (!ownerCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'Only the trip owner can remove members' });
    return;
  }
  if (targetUserId === auth.userId) {
    res.status(400).json({ error: 'validation_error', message: 'Owner cannot remove themselves' });
    return;
  }

  const { rowCount } = await pool.query(
    `DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, targetUserId],
  );
  if (!rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Member not found' });
    return;
  }
  res.status(204).send();
});

// GET /trips/:id/members — list all trip members
router.get('/:id/members', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id: tripId } = req.params;

  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, auth.userId],
  );
  if (!memberCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'You are not a member of this trip' });
    return;
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.avatar_url, tm.role, tm.joined_at
     FROM trip_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.trip_id = $1
     ORDER BY tm.joined_at ASC`,
    [tripId],
  );
  res.json(rows);
});

async function getTripById(tripId: string, userId: string) {
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.destination, t.start_date, t.end_date, t.owner_id, t.created_at, t.updated_at
     FROM trips t WHERE t.id = $1`,
    [tripId],
  );
  return rows[0] ?? null;
}

void crypto;

export default router;

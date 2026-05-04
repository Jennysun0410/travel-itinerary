import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db/client';

const router = Router();
router.use(requireAuth);

// GET /orders/unassigned — list unassigned orders for the user
router.get('/unassigned', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { rows } = await pool.query(
    `SELECT o.*, u.display_name AS created_by_name
     FROM orders o
     JOIN users u ON u.id = o.created_by
     WHERE o.created_by = $1 AND o.trip_id IS NULL
     ORDER BY o.start_datetime ASC`,
    [auth.userId],
  );
  res.json(rows.map(mapOrder));
});

// PATCH /orders/unassigned/:id/assign — assign unassigned order to a trip
router.patch('/unassigned/:id/assign', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id } = req.params;
  const { trip_id } = req.body as { trip_id: string };

  if (!trip_id) {
    res.status(400).json({ error: 'validation_error', message: 'trip_id is required' });
    return;
  }

  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [trip_id, auth.userId],
  );
  if (!memberCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'You are not a member of that trip' });
    return;
  }

  const { rowCount, rows } = await pool.query(
    `UPDATE orders SET trip_id = $1, updated_at = NOW()
     WHERE id = $2 AND created_by = $3 AND trip_id IS NULL
     RETURNING *`,
    [trip_id, id, auth.userId],
  );
  if (!rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Unassigned order not found' });
    return;
  }
  res.json(mapOrder(rows[0]));
});

// GET /trips/:tripId/orders — list orders for a trip with optional type filter
router.get('/trips/:tripId/orders', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { tripId } = req.params;
  const { type } = req.query as { type?: string };

  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, auth.userId],
  );
  if (!memberCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'You are not a member of this trip' });
    return;
  }

  const params: unknown[] = [tripId];
  let typeFilter = '';
  if (type && ['flight', 'accommodation', 'activity'].includes(type)) {
    params.push(type);
    typeFilter = `AND o.type = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT o.*, u.display_name AS created_by_name
     FROM orders o
     JOIN users u ON u.id = o.created_by
     WHERE o.trip_id = $1 ${typeFilter}
     ORDER BY o.start_datetime ASC`,
    params,
  );
  res.json(rows.map(mapOrder));
});

// POST /trips/:tripId/orders — manually add an order
router.post('/trips/:tripId/orders', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { tripId } = req.params;
  const { type, vendor, booking_ref, start_datetime, end_datetime, price, currency, status } =
    req.body as {
      type: string; vendor: string; booking_ref: string;
      start_datetime: string; end_datetime: string;
      price: number; currency: string; status?: string;
    };

  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, auth.userId],
  );
  if (!memberCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'You are not a member of this trip' });
    return;
  }

  const { rows } = await pool.query(
    `INSERT INTO orders (trip_id, created_by, type, vendor, booking_ref, start_datetime, end_datetime, price, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [tripId, auth.userId, type, vendor ?? '', booking_ref ?? '', start_datetime, end_datetime, price ?? 0, currency ?? 'USD', status ?? 'confirmed'],
  );
  const order = rows[0];
  const userRow = await pool.query<{ display_name: string }>(`SELECT display_name FROM users WHERE id = $1`, [auth.userId]);
  res.status(201).json(mapOrder({ ...order, created_by_name: userRow.rows[0].display_name }));
});

// PATCH /orders/:id — edit order fields
router.patch('/:id', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id } = req.params;

  const orderCheck = await pool.query<{ trip_id: string | null }>(
    `SELECT o.trip_id FROM orders o
     LEFT JOIN trip_members tm ON tm.trip_id = o.trip_id AND tm.user_id = $2
     WHERE o.id = $1 AND (o.created_by = $2 OR tm.user_id IS NOT NULL)`,
    [id, auth.userId],
  );
  if (!orderCheck.rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Order not found or access denied' });
    return;
  }

  const allowed = ['vendor', 'booking_ref', 'type', 'start_datetime', 'end_datetime', 'price', 'currency', 'status', 'flagged_for_review'];
  const updates = Object.entries(req.body as Record<string, unknown>).filter(([k]) => allowed.includes(k));
  if (!updates.length) {
    res.status(400).json({ error: 'validation_error', message: 'No valid fields to update' });
    return;
  }

  const setClauses = updates.map(([k], i) => `${k} = $${i + 3}`).join(', ');
  const values = updates.map(([, v]) => v);

  const { rows } = await pool.query(
    `UPDATE orders
     SET ${setClauses}, last_modified_by = $1, last_modified_at = NOW(), updated_at = NOW(), flagged_for_review = FALSE
     WHERE id = $2
     RETURNING *`,
    [auth.userId, id, ...values],
  );
  const userRow = await pool.query<{ display_name: string }>(`SELECT display_name FROM users WHERE id = $1`, [auth.userId]);
  res.json(mapOrder({ ...rows[0], created_by_name: userRow.rows[0].display_name }));
});

// DELETE /orders/:id — delete order (cascade-deletes timeline slot)
router.delete('/:id', async (req, res: Response) => {
  const auth = req as unknown as AuthRequest;
  const { id } = req.params;

  const orderCheck = await pool.query(
    `SELECT o.id FROM orders o
     LEFT JOIN trip_members tm ON tm.trip_id = o.trip_id AND tm.user_id = $2
     WHERE o.id = $1 AND (o.created_by = $2 OR tm.user_id IS NOT NULL)`,
    [id, auth.userId],
  );
  if (!orderCheck.rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Order not found or access denied' });
    return;
  }

  await pool.query(`DELETE FROM orders WHERE id = $1`, [id]);
  res.status(204).send();
});

function mapOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    tripId: row.trip_id,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    lastModifiedBy: row.last_modified_by,
    lastModifiedAt: row.last_modified_at,
    type: row.type,
    vendor: row.vendor,
    bookingRef: row.booking_ref,
    startDatetime: row.start_datetime,
    endDatetime: row.end_datetime,
    price: Number(row.price),
    currency: row.currency,
    status: row.status,
    rawEmailId: row.raw_email_id,
    flaggedForReview: row.flagged_for_review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;

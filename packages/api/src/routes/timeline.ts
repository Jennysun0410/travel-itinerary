import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db/client';

const router = Router();
router.use(requireAuth);

// GET /trips/:tripId/timeline — slots grouped by day
router.get('/trips/:tripId/timeline', async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { tripId } = req.params;

  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, auth.userId],
  );
  if (!memberCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'You are not a member of this trip' });
    return;
  }

  const { rows } = await pool.query(
    `SELECT ts.*, u.display_name AS placed_by_name,
            o.type, o.vendor, o.booking_ref, o.start_datetime, o.end_datetime, o.price, o.currency, o.status,
            ou.display_name AS order_created_by_name, o.created_by AS order_created_by
     FROM timeline_slots ts
     JOIN orders o ON o.id = ts.order_id
     JOIN users u ON u.id = ts.placed_by
     JOIN users ou ON ou.id = o.created_by
     WHERE ts.trip_id = $1
     ORDER BY ts.day ASC, ts.position ASC`,
    [tripId],
  );

  const grouped: Record<string, unknown[]> = {};
  for (const row of rows) {
    const day = (row.day as Date).toISOString().slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(mapSlot(row));
  }
  res.json(grouped);
});

// POST /trips/:tripId/timeline — create a slot
router.post('/trips/:tripId/timeline', async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { tripId } = req.params;
  const { order_id, day, position } = req.body as { order_id: string; day: string; position?: number };

  if (!order_id || !day) {
    res.status(400).json({ error: 'validation_error', message: 'order_id and day are required' });
    return;
  }

  const memberCheck = await pool.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, auth.userId],
  );
  if (!memberCheck.rowCount) {
    res.status(403).json({ error: 'forbidden', message: 'You are not a member of this trip' });
    return;
  }

  // Reject if order already has a slot
  const existing = await pool.query(
    `SELECT 1 FROM timeline_slots WHERE order_id = $1`,
    [order_id],
  );
  if (existing.rowCount) {
    res.status(409).json({ error: 'conflict', message: 'Order is already placed on the timeline' });
    return;
  }

  const pos = position ?? 0;
  const { rows } = await pool.query(
    `INSERT INTO timeline_slots (trip_id, order_id, day, position, placed_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [tripId, order_id, day, pos, auth.userId],
  );

  const full = await pool.query(
    `SELECT ts.*, u.display_name AS placed_by_name,
            o.type, o.vendor, o.booking_ref, o.start_datetime, o.end_datetime, o.price, o.currency, o.status,
            ou.display_name AS order_created_by_name, o.created_by AS order_created_by
     FROM timeline_slots ts
     JOIN orders o ON o.id = ts.order_id
     JOIN users u ON u.id = ts.placed_by
     JOIN users ou ON ou.id = o.created_by
     WHERE ts.id = $1`,
    [rows[0].id],
  );
  res.status(201).json(mapSlot(full.rows[0]));
});

// PATCH /timeline/:id — update day and/or position
router.patch('/:id', async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { id } = req.params;
  const { day, position } = req.body as { day?: string; position?: number };

  const slotCheck = await pool.query(
    `SELECT ts.id FROM timeline_slots ts
     JOIN trip_members tm ON tm.trip_id = ts.trip_id AND tm.user_id = $2
     WHERE ts.id = $1`,
    [id, auth.userId],
  );
  if (!slotCheck.rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Timeline slot not found or access denied' });
    return;
  }

  const updates: string[] = [];
  const values: unknown[] = [id];
  if (day !== undefined) { values.push(day); updates.push(`day = $${values.length}`); }
  if (position !== undefined) { values.push(position); updates.push(`position = $${values.length}`); }
  if (!updates.length) {
    res.status(400).json({ error: 'validation_error', message: 'No valid fields to update' });
    return;
  }
  updates.push(`updated_at = NOW()`);

  await pool.query(`UPDATE timeline_slots SET ${updates.join(', ')} WHERE id = $1`, values);

  const full = await pool.query(
    `SELECT ts.*, u.display_name AS placed_by_name,
            o.type, o.vendor, o.booking_ref, o.start_datetime, o.end_datetime, o.price, o.currency, o.status,
            ou.display_name AS order_created_by_name, o.created_by AS order_created_by
     FROM timeline_slots ts
     JOIN orders o ON o.id = ts.order_id
     JOIN users u ON u.id = ts.placed_by
     JOIN users ou ON ou.id = o.created_by
     WHERE ts.id = $1`,
    [id],
  );
  res.json(mapSlot(full.rows[0]));
});

// DELETE /timeline/:id — remove slot (keep order)
router.delete('/:id', async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { id } = req.params;

  const slotCheck = await pool.query(
    `SELECT ts.id FROM timeline_slots ts
     JOIN trip_members tm ON tm.trip_id = ts.trip_id AND tm.user_id = $2
     WHERE ts.id = $1`,
    [id, auth.userId],
  );
  if (!slotCheck.rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Timeline slot not found or access denied' });
    return;
  }

  await pool.query(`DELETE FROM timeline_slots WHERE id = $1`, [id]);
  res.status(204).send();
});

function mapSlot(row: Record<string, unknown>) {
  return {
    id: row.id,
    tripId: row.trip_id,
    orderId: row.order_id,
    day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : row.day,
    position: row.position,
    placedBy: row.placed_by,
    placedByName: row.placed_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    order: {
      id: row.order_id,
      type: row.type,
      vendor: row.vendor,
      bookingRef: row.booking_ref,
      startDatetime: row.start_datetime,
      endDatetime: row.end_datetime,
      price: Number(row.price),
      currency: row.currency,
      status: row.status,
      createdBy: row.order_created_by,
      createdByName: row.order_created_by_name,
    },
  };
}

export default router;

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { scanGmailForPreview } from '../email/gmail';
import { ParsedOrder } from '../email/parser';
import pool from '../db/client';

const router = Router();

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

router.post('/gmail/preview', requireAuth, async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { from, to, trip_id } = req.body as { from: string; to: string; trip_id: string };

  if (!from || !to || !datePattern.test(from) || !datePattern.test(to) || from > to || !trip_id) {
    res.status(400).json({ error: 'validation_error', message: 'from, to (YYYY-MM-DD, from <= to) and trip_id are required' });
    return;
  }

  let tripDateRange: { start: string; end: string } | undefined;
  const { rows } = await pool.query<{ start_date: string; end_date: string }>(
    `SELECT start_date::text AS start_date, end_date::text AS end_date FROM trips WHERE id = $1`,
    [trip_id],
  );
  if (rows.length) {
    tripDateRange = { start: rows[0].start_date, end: rows[0].end_date };
  }

  try {
    const orders = await scanGmailForPreview(auth.userId, from, to, tripDateRange);
    res.json(orders);
  } catch (err) {
    if (err instanceof Error && err.message === 'no_gmail_connection') {
      res.status(400).json({ error: 'no_gmail_connection', message: 'No Gmail account connected' });
      return;
    }
    console.error('Gmail preview error:', err);
    res.status(500).json({ error: 'preview_failed', message: (err instanceof Error ? err.message : 'Unknown error') });
  }
});

router.post('/gmail/import', requireAuth, async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { trip_id, orders } = req.body as { trip_id: string; orders: ParsedOrder[] };

  if (!trip_id || !Array.isArray(orders) || orders.length === 0) {
    res.status(400).json({ error: 'validation_error', message: 'trip_id and a non-empty orders array are required' });
    return;
  }

  let imported = 0;
  for (const order of orders) {
    const result = await pool.query(
      `INSERT INTO orders (
         trip_id, created_by, type, vendor, booking_ref,
         start_datetime, end_datetime, price, currency,
         raw_email_id, flagged_for_review, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed')
       ON CONFLICT (raw_email_id) DO NOTHING`,
      [
        trip_id,
        auth.userId,
        order.type,
        order.vendor,
        order.booking_ref,
        order.start_datetime,
        order.end_datetime,
        order.price,
        order.currency,
        order.raw_email_id,
        order.flagged_for_review,
      ],
    );
    if (result.rowCount === 1) imported++;
  }

  res.json({ imported });
});

export default router;

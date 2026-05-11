import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { scanGmailByDateRange } from '../email/gmail';
import pool from '../db/client';

const router = Router();

router.post('/gmail/scan', requireAuth, async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { from, to, trip_id } = req.body as { from: string; to: string; trip_id?: string };

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!from || !to || !datePattern.test(from) || !datePattern.test(to) || from > to) {
    res.status(400).json({ error: 'validation_error', message: 'from and to must be valid YYYY-MM-DD dates with from <= to' });
    return;
  }

  let tripDateRange: { start: string; end: string } | undefined;
  if (trip_id) {
    const { rows } = await pool.query<{ start_date: string; end_date: string }>(
      `SELECT start_date::text AS start_date, end_date::text AS end_date FROM trips WHERE id = $1`,
      [trip_id],
    );
    if (rows.length) {
      tripDateRange = { start: rows[0].start_date, end: rows[0].end_date };
    }
  }

  try {
    const result = await scanGmailByDateRange(auth.userId, from, to, tripDateRange);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'no_gmail_connection') {
      res.status(400).json({ error: 'no_gmail_connection', message: 'No Gmail account connected' });
      return;
    }
    console.error('Gmail scan error:', err);
    res.status(500).json({ error: 'scan_failed', message: (err instanceof Error ? err.message : 'Unknown error') });
  }
});

export default router;

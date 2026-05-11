import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { scanGmailByDateRange } from '../email/gmail';

const router = Router();

router.post('/gmail/scan', requireAuth, async (req, res: Response) => {
  const auth = req as AuthRequest;
  const { from, to } = req.body as { from: string; to: string };

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!from || !to || !datePattern.test(from) || !datePattern.test(to) || from > to) {
    res.status(400).json({ error: 'validation_error', message: 'from and to must be valid YYYY-MM-DD dates with from <= to' });
    return;
  }

  try {
    const result = await scanGmailByDateRange(auth.userId, from, to);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'no_gmail_connection') {
      res.status(400).json({ error: 'no_gmail_connection', message: 'No Gmail account connected' });
      return;
    }
    throw err;
  }
});

export default router;

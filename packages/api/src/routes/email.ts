import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getGmailAuthUrl, handleGmailCallback, handleGmailPushNotification } from '../email/gmail';
import { getOutlookAuthUrl, handleOutlookCallback, handleOutlookWebhook } from '../email/outlook';
import pool from '../db/client';

const router = Router();

// Gmail OAuth flow
router.get('/gmail/connect', requireAuth, (req, res: Response) => {
  const auth = req as AuthRequest;
  res.redirect(getGmailAuthUrl(auth.userId));
});

router.get('/gmail/connect-url', requireAuth, (req, res: Response) => {
  const auth = req as AuthRequest;
  res.json({ url: getGmailAuthUrl(auth.userId) });
});

router.get('/gmail/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query as { code: string; state: string };
  await handleGmailCallback(code, userId);
  res.redirect(`${process.env.WEB_URL ?? 'http://localhost:3000'}/settings/email?connected=gmail`);
});

// Gmail PubSub push handler
router.post('/gmail/webhook', async (req: Request, res: Response) => {
  res.status(204).send();
  try {
    const message = req.body?.message;
    if (!message?.data) return;
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8')) as { emailAddress: string };

    const { rows } = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM email_connections WHERE provider = 'gmail' AND email = $1`,
      [data.emailAddress],
    );
    if (rows.length) {
      await handleGmailPushNotification(rows[0].user_id);
    }
  } catch (err) {
    console.error('Gmail webhook error:', err);
  }
});

// Outlook OAuth flow
router.get('/outlook/connect', requireAuth, (_req, res: Response) => {
  res.redirect(getOutlookAuthUrl());
});

router.get('/outlook/callback', requireAuth, async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const { code } = req.query as { code: string };
  await handleOutlookCallback(code, auth.userId);
  res.redirect(`${process.env.WEB_URL ?? 'http://localhost:3000'}/settings/email?connected=outlook`);
});

// Outlook webhook
router.post('/outlook/webhook', async (req: Request, res: Response) => {
  // Outlook validation handshake
  if (req.query.validationToken) {
    res.status(200).send(req.query.validationToken);
    return;
  }
  res.status(202).send();
  try {
    const notifications = req.body?.value as Array<{ clientState: string }> | undefined;
    for (const n of notifications ?? []) {
      if (n.clientState) {
        await handleOutlookWebhook(n.clientState);
      }
    }
  } catch (err) {
    console.error('Outlook webhook error:', err);
  }
});

// DELETE /email-connections/:id — disconnect (user revokes access)
router.delete('/connections/:id', requireAuth, async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const { id } = req.params;
  const { rowCount } = await pool.query(
    `DELETE FROM email_connections WHERE id = $1 AND user_id = $2`,
    [id, auth.userId],
  );
  if (!rowCount) {
    res.status(404).json({ error: 'not_found', message: 'Email connection not found' });
    return;
  }
  res.status(204).send();
});

// GET /email/connections — list user's email connections
router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const { rows } = await pool.query(
    `SELECT id, provider, email, connected_at FROM email_connections WHERE user_id = $1`,
    [auth.userId],
  );
  res.json(rows);
});

export default router;

import { Router, Request, Response } from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../auth/google';
import { handleAppleCallback } from '../auth/apple';

const router = Router();

router.get('/google', (_req: Request, res: Response) => {
  res.redirect(getGoogleAuthUrl());
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  if (!code) {
    res.status(400).json({ error: 'missing_code', message: 'Authorization code is required' });
    return;
  }
  const { token, username } = await handleGoogleCallback(code);
  const needsOnboarding = !username;
  res.redirect(`${process.env.WEB_URL ?? 'http://localhost:3000'}/auth/callback?token=${token}&onboarding=${needsOnboarding}&step=1`);
});

router.post('/apple/callback', async (req: Request, res: Response) => {
  const { code } = req.body as { code: string };
  if (!code) {
    res.status(400).json({ error: 'missing_code', message: 'Authorization code is required' });
    return;
  }
  const { token } = await handleAppleCallback(code);
  res.json({ token });
});

export default router;

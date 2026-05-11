import { Router, Request, Response } from 'express';
import pool from '../db/client';
import { verifyToken } from '../auth/jwt';

const router = Router();

router.patch('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'unauthorized' }); return; }
  const { userId } = verifyToken(auth.slice(7));
  const { username } = req.body as { username: string };
  if (!username?.trim()) { res.status(400).json({ error: 'username required' }); return; }
  const { rows } = await pool.query(
    `UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, role`,
    [username.trim(), userId],
  );
  res.json(rows[0]);
});

export default router;

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt';

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid authorization header' });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    (req as AuthRequest).userId = payload.userId;
    (req as AuthRequest).userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}

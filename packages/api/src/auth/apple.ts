import jwt from 'jsonwebtoken';
import pool from '../db/client';
import { signToken } from './jwt';

function buildClientSecret(): string {
  const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  return jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '5m',
    audience: 'https://appleid.apple.com',
    issuer: process.env.APPLE_TEAM_ID,
    subject: process.env.APPLE_CLIENT_ID,
    keyid: process.env.APPLE_KEY_ID,
  } as jwt.SignOptions);
}

async function verifyAppleToken(idToken: string): Promise<{ sub: string; email: string; name?: string }> {
  const clientSecret = buildClientSecret();
  void clientSecret;

  const decoded = jwt.decode(idToken) as { sub: string; email: string } | null;
  if (!decoded?.sub) throw new Error('Invalid Apple ID token');
  return { sub: decoded.sub, email: decoded.email, name: undefined };
}

export async function handleAppleCallback(
  code: string,
): Promise<{ token: string; userId: string }> {
  void code;

  const idToken = code;
  const payload = await verifyAppleToken(idToken);

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (email, display_name, provider, provider_id)
     VALUES ($1, $2, 'apple', $3)
     ON CONFLICT (provider, provider_id) DO UPDATE
       SET email = EXCLUDED.email
     RETURNING id`,
    [payload.email, payload.name ?? payload.email.split('@')[0], payload.sub],
  );

  const userId = rows[0].id;
  const token = signToken({ userId, email: payload.email });
  return { token, userId };
}

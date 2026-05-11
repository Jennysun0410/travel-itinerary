import { OAuth2Client } from 'google-auth-library';
import pool from '../db/client';
import { signToken } from './jwt';

const ADMIN_EMAIL = 'hsunhuazhen@gmail.com';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export function getGoogleAuthUrl(): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(code: string): Promise<{ token: string; userId: string; username: string | null }> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload()!;

  const role = payload.email === ADMIN_EMAIL ? 'admin' : 'user';

  const { rows } = await pool.query<{ id: string; username: string | null }>(
    `INSERT INTO users (email, display_name, avatar_url, provider, provider_id, role)
     VALUES ($1, $2, $3, 'google', $4, $5)
     ON CONFLICT (provider, provider_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           avatar_url   = EXCLUDED.avatar_url,
           role         = EXCLUDED.role
     RETURNING id, username`,
    [payload.email, payload.name, payload.picture, payload.sub, role],
  );

  const { id: userId, username } = rows[0];
  const { rows: gmailRows } = await pool.query(
    `SELECT 1 FROM email_connections WHERE user_id = $1 AND provider = 'gmail'`,
    [userId],
  );
  const hasGmail = gmailRows.length > 0;
  const token = signToken({ userId, email: payload.email!, role, username });
  return { token, userId, username, hasGmail };
}

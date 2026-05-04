import { OAuth2Client } from 'google-auth-library';
import pool from '../db/client';
import { signToken } from './jwt';

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

export async function handleGoogleCallback(code: string): Promise<{ token: string; userId: string }> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload()!;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (email, display_name, avatar_url, provider, provider_id)
     VALUES ($1, $2, $3, 'google', $4)
     ON CONFLICT (provider, provider_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           avatar_url   = EXCLUDED.avatar_url
     RETURNING id`,
    [payload.email, payload.name, payload.picture, payload.sub],
  );

  const userId = rows[0].id;
  const token = signToken({ userId, email: payload.email! });
  return { token, userId };
}

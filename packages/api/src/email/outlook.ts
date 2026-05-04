import pool from '../db/client';
import { encrypt, decrypt } from './encryption';
import { enqueueEmailForParsing } from './parser';

const TENANT = 'common';
const GRAPH_URL = 'https://graph.microsoft.com/v1.0';
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;

export function getOutlookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    scope: 'offline_access Mail.Read User.Read',
    response_mode: 'query',
  });
  return `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize?${params}`;
}

export async function handleOutlookCallback(code: string, userId: string): Promise<void> {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(TOKEN_URL, { method: 'POST', body });
  const tokens = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number };

  const userRes = await fetch(`${GRAPH_URL}/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json() as { mail: string; userPrincipalName: string };
  const email = user.mail ?? user.userPrincipalName;
  const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

  await pool.query(
    `INSERT INTO email_connections (user_id, provider, email, access_token, refresh_token, token_expiry)
     VALUES ($1, 'outlook', $2, $3, $4, $5)
     ON CONFLICT (user_id, provider) DO UPDATE
       SET access_token  = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           token_expiry  = EXCLUDED.token_expiry,
           email         = EXCLUDED.email`,
    [userId, email, encrypt(tokens.access_token), encrypt(tokens.refresh_token), expiryDate],
  );

  await setupOutlookWebhook(userId, tokens.access_token);
}

async function setupOutlookWebhook(userId: string, accessToken: string): Promise<void> {
  const expiry = new Date(Date.now() + 3600 * 1000 * 24 * 2);
  await fetch(`${GRAPH_URL}/subscriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      changeType: 'created',
      notificationUrl: `${process.env.API_PUBLIC_URL}/email/outlook/webhook`,
      resource: `users/${userId}/messages`,
      expirationDateTime: expiry.toISOString(),
      clientState: userId,
    }),
  });
}

export async function handleOutlookWebhook(userId: string): Promise<void> {
  const { rows } = await pool.query<{ access_token: string }>(
    `SELECT access_token FROM email_connections WHERE user_id = $1 AND provider = 'outlook'`,
    [userId],
  );
  if (!rows.length) return;

  const accessToken = decrypt(rows[0].access_token);
  const filter = encodeURIComponent(
    `contains(subject, 'booking') or contains(subject, 'reservation') or contains(subject, 'confirmation') or contains(subject, 'e-ticket')`,
  );
  const res = await fetch(`${GRAPH_URL}/me/messages?$filter=${filter}&$top=20&$select=id,body`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as { value: Array<{ id: string; body: { content: string } }> };

  for (const msg of data.value ?? []) {
    await enqueueEmailForParsing(userId, msg.id, msg.body.content);
  }
}

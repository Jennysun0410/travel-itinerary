import { google } from 'googleapis';
import pdfParse from 'pdf-parse';
import pool from '../db/client';
import { encrypt, decrypt } from './encryption';
import { enqueueEmailForParsing, parseEmail, ParsedOrder } from './parser';

const GMAIL_REDIRECT_URI = process.env.GOOGLE_GMAIL_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI?.replace('auth/google/callback', 'email/gmail/callback');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GMAIL_REDIRECT_URI,
);

export function getGmailAuthUrl(userId: string, loginHint?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
    state: userId,
    login_hint: loginHint,
  });
}

export async function handleGmailCallback(code: string, userId: string): Promise<void> {
  const { tokens } = await oauth2Client.getToken(code);

  const userInfoClient = new google.auth.OAuth2();
  userInfoClient.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: userInfoClient });
  const { data } = await oauth2.userinfo.get();

  await pool.query(
    `INSERT INTO email_connections (user_id, provider, email, access_token, refresh_token, token_expiry)
     VALUES ($1, 'gmail', $2, $3, $4, $5)
     ON CONFLICT (user_id, provider) DO UPDATE
       SET access_token  = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           token_expiry  = EXCLUDED.token_expiry,
           email         = EXCLUDED.email`,
    [
      userId,
      data.email,
      encrypt(tokens.access_token!),
      encrypt(tokens.refresh_token!),
      new Date(tokens.expiry_date!),
    ],
  );

  await setupGmailPushNotifications(userId, tokens.access_token!);
}

async function setupGmailPushNotifications(userId: string, accessToken: string): Promise<void> {
  if (!process.env.GOOGLE_PUBSUB_TOPIC) return;
  void userId;
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth });

  await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: process.env.GOOGLE_PUBSUB_TOPIC,
      labelIds: ['INBOX'],
    },
  });
}

export async function scanGmailByDateRange(userId: string, from: string, to: string, tripDateRange?: { start: string; end: string }): Promise<{ imported: number; skipped: number }> {
  const { rows } = await pool.query<{ access_token: string; refresh_token: string; token_expiry: Date }>(
    `SELECT access_token, refresh_token, token_expiry FROM email_connections WHERE user_id = $1 AND provider = 'gmail'`,
    [userId],
  );
  if (!rows.length) throw new Error('no_gmail_connection');

  const conn = rows[0];
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: decrypt(conn.access_token),
    refresh_token: decrypt(conn.refresh_token),
    expiry_date: conn.token_expiry.getTime(),
  });

  const gmail = google.gmail({ version: 'v1', auth });
  const afterDate = from.replace(/-/g, '/');
  const beforeDate = new Date(new Date(to).getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '/');
  const q = `(from:(agoda.com OR booking.com OR airbnb.com OR klook.com OR trip.com OR evaair.com OR china-airlines.com OR flyscoot.com OR airasia.com OR tigerairtw.com OR flypeach.com) OR subject:(confirmation OR 確認 OR 預訂 OR 訂單 OR itinerary OR e-ticket OR booking)) after:${afterDate} before:${beforeDate}`;

  const { data } = await gmail.users.messages.list({ userId: 'me', q, maxResults: 50 });

  let imported = 0;
  let skipped = 0;

  for (const msg of data.messages ?? []) {
    const existing = await pool.query(`SELECT 1 FROM orders WHERE raw_email_id = $1`, [msg.id!]);
    if (existing.rowCount) {
      skipped++;
      continue;
    }
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' });
    const raw = extractEmailText(full.data);
    await enqueueEmailForParsing(userId, msg.id!, raw, tripDateRange);
    imported++;
  }

  return { imported, skipped };
}

export async function scanGmailForPreview(userId: string, from: string, to: string, tripDateRange?: { start: string; end: string }): Promise<ParsedOrder[]> {
  const { rows } = await pool.query<{ access_token: string; refresh_token: string; token_expiry: Date }>(
    `SELECT access_token, refresh_token, token_expiry FROM email_connections WHERE user_id = $1 AND provider = 'gmail'`,
    [userId],
  );
  if (!rows.length) throw new Error('no_gmail_connection');

  const conn = rows[0];
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: decrypt(conn.access_token),
    refresh_token: decrypt(conn.refresh_token),
    expiry_date: conn.token_expiry.getTime(),
  });

  const gmail = google.gmail({ version: 'v1', auth });
  const afterDate = from.replace(/-/g, '/');
  const beforeDate = new Date(new Date(to).getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '/');
  const q = `(from:(agoda.com OR booking.com OR airbnb.com OR klook.com OR trip.com OR evaair.com OR china-airlines.com OR flyscoot.com OR airasia.com OR tigerairtw.com OR flypeach.com) OR subject:(confirmation OR 確認 OR 預訂 OR 訂單 OR itinerary OR e-ticket OR booking)) after:${afterDate} before:${beforeDate}`;

  const { data } = await gmail.users.messages.list({ userId: 'me', q, maxResults: 50 });

  const results: ParsedOrder[] = [];
  for (const msg of data.messages ?? []) {
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' });
    const raw = extractEmailText(full.data);
    const order = parseEmail(msg.id!, raw, tripDateRange);
    if (order) results.push(order);
  }

  return results;
}

export async function handleGmailPushNotification(userId: string): Promise<void> {
  const { rows } = await pool.query<{ access_token: string; refresh_token: string; token_expiry: Date }>(
    `SELECT access_token, refresh_token, token_expiry FROM email_connections WHERE user_id = $1 AND provider = 'gmail'`,
    [userId],
  );
  if (!rows.length) return;

  const conn = rows[0];
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({
    access_token: decrypt(conn.access_token),
    refresh_token: decrypt(conn.refresh_token),
    expiry_date: conn.token_expiry.getTime(),
  });

  const gmail = google.gmail({ version: 'v1', auth });
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    q: 'subject:(booking confirmation OR reservation OR order confirmation OR e-ticket) newer_than:1d',
    maxResults: 20,
  });

  for (const msg of data.messages ?? []) {
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'full' });
    const raw = await extractEmailText(full.data);
    await enqueueEmailForParsing(userId, msg.id!, raw);
  }
}

type GmailPart = {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: GmailPart[] | null;
};

type GmailMsg = { payload?: (GmailPart & { parts?: GmailPart[] | null }) | null };

function collectParts(part: GmailPart): GmailPart[] {
  const result: GmailPart[] = [part];
  for (const child of part.parts ?? []) {
    result.push(...collectParts(child));
  }
  return result;
}

async function extractEmailText(msg: GmailMsg): Promise<string> {
  const payload = msg.payload;
  if (!payload) return '';

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  const parts = collectParts(payload as GmailPart);

  let textBody = '';
  for (const part of parts) {
    if ((part.mimeType === 'text/plain' || part.mimeType === 'text/html') && part.body?.data) {
      textBody = Buffer.from(part.body.data, 'base64').toString('utf8');
      break;
    }
  }

  const pdfTexts: string[] = [];
  for (const part of parts) {
    if (part.mimeType === 'application/pdf' && part.body?.data) {
      try {
        const buf = Buffer.from(part.body.data, 'base64');
        const parsed = await pdfParse(buf);
        if (parsed.text) pdfTexts.push(parsed.text);
      } catch {
        // silently skip unreadable PDF
      }
    }
  }

  return [textBody, ...pdfTexts].filter(Boolean).join('\n\n');
}

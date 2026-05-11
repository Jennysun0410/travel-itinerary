import Anthropic from '@anthropic-ai/sdk';
import pool from '../db/client';
import { checkParseRateLimit } from './ratelimit';
type OrderType = 'flight' | 'accommodation' | 'activity';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BOOKING_KEYWORDS = [
  'booking confirmation', 'reservation', 'order confirmation',
  'e-ticket', 'itinerary', 'booking reference', 'confirmation number',
];

interface ParsedOrder {
  type: OrderType;
  vendor: string;
  booking_ref: string;
  start_datetime: string;
  end_datetime: string;
  price: number;
  currency: string;
  confidence: 'high' | 'low';
}

function extractBookingDate(type: OrderType, body: string): string | null {
  const patterns: Record<OrderType, RegExp> = {
    flight: /Departure[\s:]+([A-Za-z]+ \d+, \d{4}|\d{4}-\d{2}-\d{2})/i,
    accommodation: /Check-in[\s:]+([A-Za-z]+ \d+, \d{4}|\d{4}-\d{2}-\d{2})/i,
    activity: /Date[\s:]+([A-Za-z]+ \d+, \d{4}|\d{4}-\d{2}-\d{2})/i,
  };
  const match = body.match(patterns[type]);
  if (!match) return null;
  try {
    return new Date(match[1]).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export function isBookingEmail(subject: string): boolean {
  const lower = subject.toLowerCase();
  return BOOKING_KEYWORDS.some(kw => lower.includes(kw));
}

export async function enqueueEmailForParsing(userId: string, emailId: string, body: string): Promise<void> {
  const alreadyParsed = await pool.query(
    `SELECT 1 FROM orders WHERE raw_email_id = $1`,
    [emailId],
  );
  if (alreadyParsed.rowCount) return;

  const { allowed, retryAfterMs } = checkParseRateLimit(userId);
  if (!allowed) {
    console.warn(`Rate limit exceeded for user ${userId}; retry after ${retryAfterMs}ms`);
    return;
  }

  await parseEmail(userId, emailId, body);
}

async function parseEmail(userId: string, emailId: string, body: string): Promise<void> {
  const prompt = `You are extracting booking information from a travel confirmation email.
Extract the following fields as JSON. If a field cannot be determined with confidence, set it to null.

Email content:
${body.slice(0, 8000)}

Return ONLY valid JSON with these fields:
{
  "type": "flight" | "accommodation" | "activity",
  "vendor": string or null,
  "booking_ref": string or null,
  "start_datetime": ISO 8601 datetime string or null,
  "end_datetime": ISO 8601 datetime string or null,
  "price": number or null,
  "currency": 3-letter ISO code or null
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  let parsed: Partial<ParsedOrder> = {};

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch {
    parsed = {};
  }

  const requiredFields = ['type', 'vendor', 'booking_ref', 'start_datetime', 'end_datetime'];
  const hasAllRequired = requiredFields.every(f => parsed[f as keyof ParsedOrder] != null);
  const flagged = !hasAllRequired;

  const orderType = parsed.type ?? 'activity';
  const bookingDate = extractBookingDate(orderType, body);

  await pool.query(
    `INSERT INTO orders (
       trip_id, created_by, type, vendor, booking_ref,
       start_datetime, end_datetime, price, currency,
       raw_email_id, flagged_for_review, status, booking_date
     ) VALUES (
       NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', $11
     )`,
    [
      userId,
      orderType,
      parsed.vendor ?? '',
      parsed.booking_ref ?? '',
      parsed.start_datetime ?? new Date().toISOString(),
      parsed.end_datetime ?? new Date().toISOString(),
      parsed.price ?? 0,
      parsed.currency ?? 'USD',
      emailId,
      flagged,
      bookingDate,
    ],
  );
}

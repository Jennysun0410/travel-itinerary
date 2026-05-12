import pool from '../db/client';
import { checkParseRateLimit } from './ratelimit';
type OrderType = 'flight' | 'accommodation' | 'activity';

export interface ParsedOrder {
  raw_email_id: string;
  type: OrderType;
  vendor: string;
  booking_ref: string;
  start_datetime: string;
  end_datetime: string;
  price: number;
  currency: string;
  flagged_for_review: boolean;
}

const BOOKING_KEYWORDS = [
  'booking confirmation', 'reservation', 'order confirmation',
  'e-ticket', 'itinerary', 'booking reference', 'confirmation number',
  '訂單確認', '預訂確認', '訂房確認', '機票確認', '確認信',
];

const BOOKING_BODY_KEYWORDS = [
  'booking reference', 'confirmation number', 'order number', 'reservation number',
  'booking id', 'confirmation code', 'e-ticket', 'booking details',
  '訂單編號', '預訂編號', '確認碼', '訂位代碼',
];

function isBookingBody(body: string): boolean {
  const lower = body.toLowerCase();
  return BOOKING_BODY_KEYWORDS.some(kw => lower.includes(kw));
}

function detectType(body: string): OrderType {
  const lower = body.toLowerCase();
  if (/flight|airline|departure|arrival|e-ticket|boarding pass|航班|機票|起飛|抵達|出發班機/.test(lower)) return 'flight';
  if (/hotel|check-in|check-out|check in|check out|accommodation|hostel|resort|room|飯店|住宿|入住|退房|客房/.test(lower)) return 'accommodation';
  return 'activity';
}

function extractBookingRef(body: string): string {
  const patterns = [
    /booking\s+(?:reference|ref|number|no\.?|id)[:\s#]+([A-Z0-9\-]{4,20})/i,
    /confirmation\s+(?:number|no\.?|code|id)[:\s#]+([A-Z0-9\-]{4,20})/i,
    /order\s+(?:id|number|no\.?)[:\s#]+([A-Z0-9\-]{4,20})/i,
    /reservation\s+(?:number|no\.?|id|code)[:\s#]+([A-Z0-9\-]{4,20})/i,
    /(?:ref|reference)[:\s#]+([A-Z0-9\-]{4,20})/i,
    /訂單編號[：:\s]+([A-Z0-9\-]{4,20})/i,
    /確認碼[：:\s]+([A-Z0-9\-]{4,20})/i,
  ];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) return m[1].trim();
  }
  return '';
}

function extractVendor(body: string): string {
  const patterns = [
    /(?:your booking with|booked with|reservation at|stay at|flight with)[:\s]+([A-Za-z\s&\-\.]+?)(?:\n|<|,|\.|!)/i,
    /(?:from|by)[:\s]+([A-Za-z\s&\-\.]{3,40}?)(?:\s*<|\n)/i,
  ];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      const v = m[1].trim();
      if (v.length >= 2 && v.length <= 50) return v;
    }
  }
  return '';
}

function parseDate(str: string): string | null {
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* fall through */ }
  return null;
}

function extractDatetimes(body: string): { start: string | null; end: string | null } {
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?)/g,
    /([A-Za-z]+ \d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/g,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
  ];

  const startKeywords = ['departure', 'check-in', 'check in', 'start date', 'from', 'outbound', 'travel date', '出發', '入住', '開始'];
  const endKeywords = ['return', 'check-out', 'check out', 'end date', 'arrival', 'inbound', '返回', '退房', '結束'];

  const lower = body.toLowerCase();

  function findNearDate(keywords: string[]): string | null {
    for (const kw of keywords) {
      const idx = lower.indexOf(kw);
      if (idx === -1) continue;
      const nearby = body.slice(idx, idx + 120);
      for (const p of datePatterns) {
        p.lastIndex = 0;
        const m = p.exec(nearby);
        if (m) {
          const parsed = parseDate(m[1]);
          if (parsed) return parsed;
        }
      }
    }
    return null;
  }

  const start = findNearDate(startKeywords);
  const end = findNearDate(endKeywords);

  // Fallback: grab first two dates from body
  if (!start) {
    const allDates: string[] = [];
    for (const p of datePatterns) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(body)) !== null) {
        const parsed = parseDate(m[1]);
        if (parsed && !allDates.includes(parsed)) allDates.push(parsed);
        if (allDates.length >= 2) break;
      }
      if (allDates.length >= 2) break;
    }
    return { start: allDates[0] ?? null, end: allDates[1] ?? null };
  }

  return { start, end };
}

function extractPrice(body: string): { price: number; currency: string } {
  const currencyCodes = 'USD|TWD|EUR|GBP|JPY|CNY|HKD|SGD|AUD|THB|KRW|MYR|IDR|VND|PHP';
  const patterns = [
    new RegExp(`(${currencyCodes})\\s*([\\d,]+(?:\\.\\d{2})?)`, 'i'),
    new RegExp(`([\\d,]+(?:\\.\\d{2})?)\\s*(${currencyCodes})`, 'i'),
    /(?:total|amount|price|cost)[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)/,
  ];

  for (const p of patterns) {
    const m = body.match(p);
    if (!m) continue;
    if (m[1] && /^[A-Z]{3}$/.test(m[1])) {
      return { currency: m[1].toUpperCase(), price: parseFloat(m[2].replace(/,/g, '')) || 0 };
    }
    if (m[2] && /^[A-Z]{3}$/.test(m[2])) {
      return { currency: m[2].toUpperCase(), price: parseFloat(m[1].replace(/,/g, '')) || 0 };
    }
    if (m[1]) {
      return { currency: 'USD', price: parseFloat(m[1].replace(/,/g, '')) || 0 };
    }
  }

  return { price: 0, currency: 'USD' };
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

export async function enqueueEmailForParsing(userId: string, emailId: string, body: string, tripDateRange?: { start: string; end: string }): Promise<void> {
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

  const order = parseEmail(emailId, body, tripDateRange);
  if (!order) return;

  const bookingDate = extractBookingDate(order.type, body);

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
      order.type,
      order.vendor,
      order.booking_ref,
      order.start_datetime,
      order.end_datetime,
      order.price,
      order.currency,
      order.raw_email_id,
      order.flagged_for_review,
      bookingDate,
    ],
  );
}

export function parseEmail(emailId: string, body: string, tripDateRange?: { start: string; end: string }): ParsedOrder | null {
  if (!isBookingBody(body)) return null;

  const type = detectType(body);
  const booking_ref = extractBookingRef(body);
  const vendor = extractVendor(body);
  const { start, end } = extractDatetimes(body);
  const { price, currency } = extractPrice(body);

  if (tripDateRange) {
    if (!start) return null;
    const dateStr = start.slice(0, 10);
    if (dateStr < tripDateRange.start || dateStr > tripDateRange.end) return null;
  }

  const hasAllRequired = !!(type && vendor && booking_ref && start && end);
  const flagged = !hasAllRequired;

  return {
    raw_email_id: emailId,
    type,
    vendor,
    booking_ref,
    start_datetime: start ?? new Date().toISOString(),
    end_datetime: end ?? new Date().toISOString(),
    price,
    currency,
    flagged_for_review: flagged,
  };
}

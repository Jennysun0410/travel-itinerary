// In-memory per-user rate limiter for email parse jobs.
// Allows at most MAX_PARSES_PER_WINDOW parse operations per user per window.

const MAX_PARSES_PER_WINDOW = 20;
const WINDOW_MS = 60 * 1000; // 1 minute

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkParseRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let bucket = buckets.get(userId);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(userId, bucket);
  }

  if (bucket.count >= MAX_PARSES_PER_WINDOW) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Prune stale buckets periodically to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [userId, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) buckets.delete(userId);
  }
}, WINDOW_MS * 5);

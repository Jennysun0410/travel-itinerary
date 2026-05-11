export function toUtcIso(localDatetime: string, timezoneOffset: string): string {
  return new Date(`${localDatetime}${timezoneOffset}`).toISOString();
}

export function formatLocalDatetime(utcIso: string, ianaTimezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(utcIso));
}

export function formatLocalDate(utcIso: string, ianaTimezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(utcIso));
}

// Derive a best-guess IANA timezone from a destination string using a simple lookup.
// For production, replace with a geolocation API or user selection.
const DESTINATION_TZ: Record<string, string> = {
  tokyo: 'Asia/Tokyo',
  osaka: 'Asia/Tokyo',
  kyoto: 'Asia/Tokyo',
  taipei: 'Asia/Taipei',
  'hong kong': 'Asia/Hong_Kong',
  singapore: 'Asia/Singapore',
  bangkok: 'Asia/Bangkok',
  london: 'Europe/London',
  paris: 'Europe/Paris',
  berlin: 'Europe/Berlin',
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  sydney: 'Australia/Sydney',
};

export function guessTimezoneFromDestination(destination: string): string {
  const key = destination.toLowerCase();
  for (const [city, tz] of Object.entries(DESTINATION_TZ)) {
    if (key.includes(city)) return tz;
  }
  return 'UTC';
}

export function resolveTimezone(
  bookingDate: string | null,
  destinations: Array<{ timezone: string; startDate: string; endDate: string }>,
): string {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!bookingDate) return local;
  const sorted = [...destinations].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const match = sorted.find(d => d.startDate <= bookingDate && bookingDate <= d.endDate);
  return match?.timezone ?? local;
}

import 'dotenv/config';
import pool from './client';

function guessTimezoneFromDestination(destination: string): string {
  const DESTINATION_TZ: Record<string, string> = {
    tokyo: 'Asia/Tokyo', osaka: 'Asia/Tokyo', kyoto: 'Asia/Tokyo',
    taipei: 'Asia/Taipei',
    'hong kong': 'Asia/Hong_Kong',
    singapore: 'Asia/Singapore',
    bangkok: 'Asia/Bangkok',
    seoul: 'Asia/Seoul',
    london: 'Europe/London',
    paris: 'Europe/Paris',
    berlin: 'Europe/Berlin',
    'new york': 'America/New_York',
    'los angeles': 'America/Los_Angeles',
    sydney: 'Australia/Sydney',
  };
  const key = destination.toLowerCase();
  for (const [city, tz] of Object.entries(DESTINATION_TZ)) {
    if (key.includes(city)) return tz;
  }
  return 'UTC';
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS destinations JSONB NOT NULL DEFAULT '[]'`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_date TEXT`);

    const { rows } = await client.query<{
      id: string; destination: string; start_date: string; end_date: string;
    }>(`SELECT id, destination, start_date, end_date FROM trips WHERE destination IS NOT NULL AND destination != ''`);

    for (const trip of rows) {
      const dest = [{
        name: trip.destination,
        timezone: guessTimezoneFromDestination(trip.destination),
        startDate: trip.start_date,
        endDate: trip.end_date,
      }];
      await client.query(`UPDATE trips SET destinations = $1 WHERE id = $2`, [JSON.stringify(dest), trip.id]);
    }

    console.log(`Migration complete. Updated ${rows.length} trips.`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });

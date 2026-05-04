'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import type { Trip } from '@travel/shared';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    apiFetch<Trip[]>('/trips').then(setTrips).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Trips</h1>
        <Link href="/trips/new" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
          + New Trip
        </Link>
      </div>
      {trips.length === 0 && <p>No trips yet. Create your first trip!</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {trips.map((trip) => (
          <li key={trip.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <Link href={`/trips/${trip.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ margin: 0 }}>{trip.name}</h2>
              <p style={{ margin: '4px 0', color: '#666' }}>{trip.destination}</p>
              <p style={{ margin: 0, fontSize: 14 }}>{trip.startDate} – {trip.endDate}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

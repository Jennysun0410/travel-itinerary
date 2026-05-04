'use client';

import { getApiUrl } from '../lib/api';

export default function SignInPage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <h1>Travel Itinerary</h1>
      <p>Organize all your trip bookings in one place.</p>
      <a
        href={getApiUrl('/auth/google')}
        style={{ padding: '12px 24px', background: '#4285F4', color: '#fff', borderRadius: 8, textDecoration: 'none' }}
      >
        Sign in with Google
      </a>
    </main>
  );
}

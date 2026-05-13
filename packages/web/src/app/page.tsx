'use client';

import { getApiUrl } from '../lib/api';

export default function SignInPage() {
  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #22D3EE 0%, #0EA5E9 40%, #1E40AF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Dark overlay for text contrast */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
      }} />

      {/* Top-right sign-in link */}
      <div style={{ position: 'absolute', top: 24, right: 32 }}>
        <a
          href={getApiUrl('/auth/google')}
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.9rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Sign in
        </a>
      </div>

      {/* Hero content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Travel Itinerary
        </h1>

        <p style={{
          fontStyle: 'italic',
          fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
          color: 'rgba(255,255,255,0.85)',
          margin: '16px 0 40px',
        }}>
          Every journey begins before you board.
        </p>

        <a
          href={getApiUrl('/auth/google')}
          style={{
            display: 'inline-block',
            padding: '14px 36px',
            background: '#fff',
            color: '#1E40AF',
            borderRadius: '9999px',
            fontSize: '1rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          }}
        >
          Sign in with Google
        </a>
      </div>
    </main>
  );
}

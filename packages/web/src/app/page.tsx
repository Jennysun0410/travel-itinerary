'use client';

import { getApiUrl } from '../lib/api';

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
      {/* Icon */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        {/* Circle background */}
        <circle cx="28" cy="28" r="28" fill="url(#logoGrad)" />
        {/* Route curve */}
        <path
          d="M14 36 C14 28, 22 20, 28 20 C34 20, 42 28, 42 20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Waypoint dots */}
        <circle cx="14" cy="36" r="4" fill="white" />
        <circle cx="28" cy="20" r="4" fill="white" />
        <circle cx="42" cy="20" r="4" fill="white" opacity="0.6" />
        {/* Plane at end */}
        <g transform="translate(38, 16) rotate(-35)">
          <path d="M0 0 L6 3 L0 6 L1.5 3 Z" fill="white" />
        </g>
      </svg>

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          Travel
        </span>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.8rem',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Itinerary
        </span>
      </div>
    </div>
  );
}

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
        <Logo />

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
          Organize all your trip bookings in one place.
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

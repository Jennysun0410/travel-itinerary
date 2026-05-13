'use client';

import { getApiUrl } from '../lib/api';

function LogoIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 100" fill="none">
      <path
        d="M 50 92 C 20 78, 8 55, 18 34 C 28 13, 55 12, 68 28 C 81 44, 72 65, 55 68 C 38 71, 26 55, 36 42 C 46 29, 65 32, 68 46 C 71 60, 58 72, 46 66"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function HeroShape() {
  return (
    <svg viewBox="0 0 300 340" fill="none" style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block' }}>
      <path
        d="M 150 320 C 55 285, 18 210, 32 140 C 46 70, 115 38, 162 58 C 209 78, 222 135, 196 170 C 170 205, 118 200, 112 165 C 106 130, 148 108, 178 122 C 208 136, 214 178, 192 202 C 170 226, 128 222, 118 196"
        stroke="white"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.92"
      />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(160deg, #38BDF8 0%, #0EA5E9 40%, #1D4ED8 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top nav */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 28px',
      }}>
        <LogoIcon />
        <a href={getApiUrl('/auth/google')} style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.9rem',
          fontWeight: 500,
          textDecoration: 'none',
          fontFamily: 'system-ui, sans-serif',
        }}>
          Sign in
        </a>
      </div>

      {/* Hero shape */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
      }}>
        <HeroShape />
      </div>

      {/* Bottom content */}
      <div style={{
        padding: '0 28px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <p style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}>
          Organize all your<br />trip bookings<br />in one place.
        </p>

        <a href={getApiUrl('/auth/google')} style={{
          display: 'block',
          textAlign: 'center',
          padding: '16px 0',
          background: '#fff',
          color: '#1D4ED8',
          borderRadius: '9999px',
          fontSize: '1rem',
          fontWeight: 700,
          textDecoration: 'none',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}>
          Sign in with Google
        </a>
      </div>
    </main>
  );
}

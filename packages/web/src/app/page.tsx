'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl, getToken } from '../lib/api';

function FloatingCards() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 500, height: 220, margin: '0 auto' }}>
      {/* Left card */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 30,
        width: 155,
        background: '#fff',
        borderRadius: 18,
        padding: '14px',
        transform: 'rotate(-13deg)',
        boxShadow: '0 10px 36px rgba(0,0,0,0.18)',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 1,
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111', marginBottom: 5 }}>Tokyo Trip ✈️</div>
        <div style={{ fontSize: '0.7rem', color: '#555', lineHeight: 1.55 }}>Flights, hotels &<br />bookings in one app</div>
        <div style={{ marginTop: 10, background: '#111', color: '#fff', borderRadius: 20, padding: '5px 10px', fontSize: '0.65rem', fontWeight: 600, textAlign: 'center' }}>
          + Add booking
        </div>
      </div>

      {/* Center card */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        transform: 'translateX(-50%) rotate(4deg)',
        width: 158,
        background: '#0f1728',
        borderRadius: 18,
        padding: '14px',
        boxShadow: '0 14px 44px rgba(0,0,0,0.28)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 3,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', opacity: 0.65, marginBottom: 10 }}>
          <span>TYO → NYC</span>
          <span>NH006</span>
        </div>
        <div style={{ fontSize: '0.65rem', opacity: 0.55, marginBottom: 2 }}>Departure in</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>14<br />Days</div>
        <div style={{ fontSize: '0.6rem', opacity: 0.55, marginTop: 6 }}>Fri, 27 Jun ✈️</div>
      </div>

      {/* Right card */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 22,
        width: 148,
        background: '#fff',
        borderRadius: 18,
        padding: '14px',
        transform: 'rotate(11deg)',
        boxShadow: '0 10px 36px rgba(0,0,0,0.18)',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 2,
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111', marginBottom: 6 }}>New York ↗</div>
        <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: 8 }}>5:25pm ✈️</div>
        <div style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111' }}>Tokyo ↙</div>
          <div style={{ fontSize: '0.65rem', color: '#888', marginTop: 2 }}>8:45pm</div>
        </div>
        <div style={{ marginTop: 8, border: '1.5px solid #ddd', borderRadius: 20, padding: '4px 0', fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', color: '#111' }}>
          View details
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace('/trips');
    }
  }, [router]);

  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #52AAEC 0%, #2D8EE3 55%, #1A72D4 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Cloud blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-4%', left: '-8%', width: '55vw', height: '26vw', background: 'rgba(255,255,255,0.28)', borderRadius: '50%', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', top: '12%', right: '-6%', width: '40vw', height: '20vw', background: 'rgba(255,255,255,0.22)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '22%', left: '8%', width: '50vw', height: '22vw', background: 'rgba(255,255,255,0.18)', borderRadius: '50%', filter: 'blur(56px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '35vw', height: '18vw', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(44px)' }} />
      </div>

      {/* Top nav */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '22px 28px',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          Travel Itinerary
        </span>
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

      {/* Centered content block */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px 16px',
        minHeight: 0,
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 28,
          width: '100%',
          maxWidth: 540,
        }}>
          {/* Hero heading */}
          <h1 style={{
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 8.5vw, 3.8rem)',
            lineHeight: 1.08,
            color: '#fff',
            letterSpacing: '-0.03em',
          }}>
            Place for your<br />
            trip bookings<br />
            <span style={{ opacity: 0.45 }}>and documents</span>
          </h1>

          {/* Floating cards */}
          <FloatingCards />

          {/* Subtitle */}
          <p style={{
            margin: 0,
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.82)',
            lineHeight: 1.65,
          }}>
            All your bookings, flights &amp; stays<br />
            organized in one place.
          </p>

          {/* CTA */}
          <a href={getApiUrl('/auth/google')} style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#111827',
            color: '#fff',
            borderRadius: '9999px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
          }}>
            Sign in with Google
          </a>
        </div>
      </div>
    </main>
  );
}

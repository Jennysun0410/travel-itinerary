'use client';

import Link from 'next/link';
import React from 'react';

interface NavbarProps {
  right?: React.ReactNode;
}

export function Navbar({ right }: NavbarProps) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: 56,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <Link href="/trips" style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '1rem',
        fontWeight: 700,
        color: '#2563EB',
        textDecoration: 'none',
        letterSpacing: '-0.01em',
      }}>
        Travel Itinerary
      </Link>
      {right && <div>{right}</div>}
    </header>
  );
}

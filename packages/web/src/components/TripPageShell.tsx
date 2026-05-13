'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '../lib/api';
import type { Trip } from '@travel/shared';

interface Props {
  tripId: string;
  children: React.ReactNode;
  contentStyle?: React.CSSProperties;
}

export function TripPageShell({ tripId, children, contentStyle }: Props) {
  const [tripName, setTripName] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    apiFetch<Trip>(`/trips/${tripId}`).then(t => setTripName(t.name)).catch(() => {});
  }, [tripId]);

  const tabs = [
    { label: 'Orders', href: `/trips/${tripId}/orders` },
    { label: 'Timeline', href: `/trips/${tripId}/timeline` },
    { label: 'Members', href: `/trips/${tripId}/members` },
  ];

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 20px',
          height: 52,
        }}>
          <Link href="/trips" style={{
            color: '#6B7280',
            textDecoration: 'none',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontFamily: 'system-ui, sans-serif',
          }}>
            ← My Trips
          </Link>
          {tripName && (
            <>
              <span style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>/</span>
              <span style={{
                color: '#111827',
                fontWeight: 600,
                fontSize: '0.9rem',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, sans-serif',
              }}>
                {tripName}
              </span>
            </>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', padding: '0 20px', gap: 2, borderTop: '1px solid #F3F4F6' }}>
          {tabs.map(tab => {
            const active = pathname === tab.href || pathname?.startsWith(tab.href + '/');
            return (
              <Link key={tab.href} href={tab.href} style={{
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#2563EB' : '#6B7280',
                textDecoration: 'none',
                borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
                fontFamily: 'system-ui, sans-serif',
              }}>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      <div style={{ padding: 20, ...contentStyle }}>
        {children}
      </div>
    </>
  );
}

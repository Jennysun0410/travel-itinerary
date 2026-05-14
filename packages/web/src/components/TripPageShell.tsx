'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { AppLayout, useSidebar } from './AppLayout';
import { useI18n } from '../lib/i18n';
import type { Trip } from '@travel/shared';

const S = {
  bg: '#f4f4f5',
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
} as const;

interface Props {
  tripId: string;
  children: React.ReactNode;
  contentStyle?: React.CSSProperties;
}

export function TripPageShell({ tripId, children, contentStyle }: Props) {
  const [tripName, setTripName] = useState('');
  const pathname = usePathname();
  const { t } = useI18n();
  const { openSidebar } = useSidebar();

  useEffect(() => {
    apiFetch<Trip>(`/trips/${tripId}`).then(trip => setTripName(trip.name)).catch(() => {});
  }, [tripId]);

  const tabs = [
    { key: 'orders', label: t('orders'), href: `/trips/${tripId}/orders` },
    { key: 'timeline', label: t('timeline'), href: `/trips/${tripId}/timeline` },
    { key: 'members', label: t('members'), href: `/trips/${tripId}/members` },
  ];

  return (
    <AppLayout>
      {/* Sub-header: back + trip name + tabs */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${S.border}`,
      }}>
        {/* Breadcrumb row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', height: 50 }}>
          <button
            type="button"
            onClick={openSidebar}
            aria-label={t('openMenu')}
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: `1px solid ${S.border}`, background: 'transparent',
              color: S.muted, cursor: 'pointer', display: 'grid', placeItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/trips" style={{ fontSize: '0.82rem', color: S.muted, textDecoration: 'none', fontFamily: 'inherit' }}>
            {t('backToTrips')}
          </Link>
          {tripName && (
            <>
              <span style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>/</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: S.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tripName}
              </span>
            </>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', padding: '0 20px', gap: 2, borderTop: `1px solid ${S.bg}` }}>
          {tabs.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.key} href={tab.href} style={{
                padding: '10px 14px', fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? S.text : S.muted,
                textDecoration: 'none',
                borderBottom: active ? `2px solid ${S.text}` : '2px solid transparent',
                fontFamily: 'inherit',
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
    </AppLayout>
  );
}

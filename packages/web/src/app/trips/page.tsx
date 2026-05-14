'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { AppLayout, useSidebar } from '../../components/AppLayout';
import { useI18n } from '../../lib/i18n';
import type { Trip } from '@travel/shared';

const S = {
  bg: '#f4f4f5',
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
  subtle: '#a1a1aa',
  inverse: '#fafafa',
} as const;

type Filter = 'all' | 'upcoming' | 'past';

function isUpcoming(trip: Trip) {
  if (!trip.endDate) return false;
  return new Date(trip.endDate) >= new Date();
}

function isPast(trip: Trip) {
  if (!trip.endDate) return true;
  return new Date(trip.endDate) < new Date();
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return '';
  const fmt = (d: string) => {
    const dt = new Date(d);
    return `${dt.getMonth() + 1}/${String(dt.getDate()).padStart(2, '0')}`;
  };
  const year = end ? new Date(end).getFullYear() : start ? new Date(start).getFullYear() : '';
  return `${start ? fmt(start) : '?'} — ${end ? fmt(end) : '?'} · ${year}`;
}

function TripIcon() {
  return (
    <div style={{
      flexShrink: 0, width: 44, height: 44, borderRadius: 12,
      background: S.inverse, border: `1px solid ${S.border}`,
      display: 'grid', placeItems: 'center', color: S.text,
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 18h4M12 3v2M6.5 8.5L4 11l8 1 8-1-2.5-2.5M8.5 14L7 21l5-2 5 2-1.5-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const upcoming = isUpcoming(trip);

  return (
    <Link href={`/trips/${trip.id}/orders`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        padding: '18px 18px 16px',
        border: upcoming ? `1px solid ${S.text}` : `1px solid ${S.border}`,
        boxShadow: upcoming ? `0 0 0 1px ${S.text}` : 'none',
        borderRadius: 14,
        background: S.surface,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 14, minWidth: 0 }}>
            <TripIcon />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {trip.name}
              </p>
              {trip.destination && (
                <p style={{ margin: 0, fontSize: 13, color: S.muted }}>{trip.destination}</p>
              )}
            </div>
          </div>
          {upcoming && (
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '5px 10px', borderRadius: 999,
              background: S.text, color: S.surface,
            }}>
              {t('badgeSoon')}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: `1px solid ${S.border}`,
          display: 'flex', flexWrap: 'wrap', alignItems: 'baseline',
          gap: '8px 20px', fontSize: 13, color: S.muted,
        }}>
          <span style={{ fontWeight: 500, color: S.text }}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TripsPage() {
  const { t } = useI18n();
  const { openSidebar } = useSidebar();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    apiFetch<Trip[]>('/trips').then(setTrips).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let list = trips;
    if (filter === 'upcoming') list = list.filter(isUpcoming);
    if (filter === 'past') list = list.filter(isPast);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || (t.destination ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [trips, filter, query]);

  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: t('filterAll') },
    { key: 'upcoming', label: t('filterUpcoming') },
    { key: 'past', label: t('filterPast') },
  ];

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '16px 20px 48px', flex: 1 }}>

        {/* Top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '8px 0 20px', borderBottom: `1px solid ${S.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              type="button"
              onClick={openSidebar}
              aria-label={t('openMenu')}
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: `1px solid ${S.border}`, background: S.surface,
                color: S.text, cursor: 'pointer', display: 'grid', placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {t('brand')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              title={t('help')}
              style={{
                width: 40, height: 40, borderRadius: 999,
                border: `1px solid ${S.border}`, background: S.surface,
                color: S.text, cursor: 'pointer', display: 'grid', placeItems: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 9a3 3 0 1 1 4 2.83V13M12 17h.01" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => router.push('/trips/new')}
              style={{
                appearance: 'none', border: 'none', borderRadius: 10,
                padding: '10px 18px', fontSize: 14, fontWeight: 600,
                background: S.text, color: S.surface, cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {t('newTrip')}
            </button>
          </div>
        </header>

        {/* Page title */}
        <h1 style={{ margin: '24px 0 8px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {t('pageTitle')}
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: S.muted, lineHeight: 1.5 }}>
          {t('pageSub')}
        </p>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '10px 14px',
              border: `1px solid ${S.border}`, borderRadius: 10,
              font: 'inherit', fontSize: 14, background: S.surface, color: S.text,
              outline: 'none',
            }}
          />
          {filters.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                border: `1px solid ${filter === f.key ? S.text : S.border}`,
                background: filter === f.key ? S.text : S.surface,
                color: filter === f.key ? S.surface : S.muted,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Trip list */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        ) : (
          <div style={{
            marginTop: 32, padding: '32px 24px', textAlign: 'center',
            border: `1px dashed ${S.border}`, borderRadius: 14, background: S.surface,
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600 }}>{t('emptyTitle')}</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: S.muted, lineHeight: 1.55, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              {t('emptyDesc')}
            </p>
            <button
              type="button"
              onClick={() => router.push('/trips/new')}
              style={{
                appearance: 'none', border: 'none', borderRadius: 10,
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                background: S.text, color: S.surface, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t('emptyCta')}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { Navbar } from '../../components/Navbar';
import type { Trip } from '@travel/shared';

const steps = [
  { icon: '✈️', title: '建立旅行', desc: '點右上角「+ New Trip」，輸入旅行名稱、目的地與日期，建立一個旅行資料夾。' },
  { icon: '📧', title: '匯入訂單', desc: '到「Settings → Email」連結你的 Gmail 或 Outlook，系統會自動掃描並解析機票、住宿、門票等訂購 email。' },
  { icon: '📥', title: '分配訂單', desc: '到「Inbox」查看自動解析的訂單，指定要歸入哪趟旅行，也可以手動編輯內容。' },
  { icon: '🗓️', title: '安排行程軸', desc: '進入旅行後點「Timeline」，把訂單拖進對應的日期排序，一眼看清整趟行程。' },
  { icon: '👥', title: '共享旅行', desc: '進入旅行後點「Members」，輸入旅伴 email 邀請他們加入，大家可以共同查看與編輯。' },
];

const TYPE_ICON: Record<string, string> = { flight: '✈️', accommodation: '🏨', activity: '🎫' };

function TripCard({ trip }: { trip: Trip }) {
  const start = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '';
  const end = trip.endDate ? new Date(trip.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <Link href={`/trips/${trip.id}/orders`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: '18px 20px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.1rem' }}>{TYPE_ICON.flight}</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.name}
            </span>
          </div>
          {trip.destination && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>{trip.destination}</p>
          )}
        </div>
        {(start || end) && (
          <span style={{ fontSize: '0.78rem', color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {start}{start && end ? ' – ' : ''}{end}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    apiFetch<Trip[]>('/trips').then(setTrips).catch(console.error);
  }, []);

  return (
    <>
      <Navbar right={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowHelp(true)}
            title="操作說明"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1.5px solid #BFDBFE',
              background: '#EFF6FF', color: '#2563EB',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ?
          </button>
          <Link href="/trips/new" style={{
            padding: '7px 18px',
            background: '#2563EB',
            color: '#fff',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}>
            + New Trip
          </Link>
        </div>
      } />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
          My Trips
        </h1>

        {trips.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E5E7EB',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#374151' }}>No trips yet</p>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#9CA3AF' }}>Create your first trip to get started</p>
            <Link href="/trips/new" style={{
              display: 'inline-block', padding: '10px 24px',
              background: '#2563EB', color: '#fff',
              borderRadius: '9999px', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: 600,
            }}>
              + New Trip
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </main>

      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 460, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>如何使用 Travel Itinerary</h2>
              <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{step.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 3, fontSize: '0.9rem' }}>{i + 1}. {step.title}</div>
                    <div style={{ color: '#6B7280', fontSize: '0.825rem', lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';
// v2
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import type { Trip } from '@travel/shared';

const steps = [
  { icon: '✈️', title: '建立旅行', desc: '點右上角「+ New Trip」，輸入旅行名稱、目的地與日期，建立一個旅行資料夾。' },
  { icon: '📧', title: '匯入訂單', desc: '到「Settings → Email」連結你的 Gmail 或 Outlook，系統會自動掃描並解析機票、住宿、門票等訂購 email。' },
  { icon: '📥', title: '分配訂單', desc: '到「Inbox」查看自動解析的訂單，指定要歸入哪趟旅行，也可以手動編輯內容。' },
  { icon: '🗓️', title: '安排行程軸', desc: '進入旅行後點「Timeline」，把訂單拖進對應的日期排序，一眼看清整趟行程。' },
  { icon: '👥', title: '共享旅行', desc: '進入旅行後點「Members」，輸入旅伴 email 邀請他們加入，大家可以共同查看與編輯。' },
];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    apiFetch<Trip[]>('/trips').then(setTrips).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Trips ✓</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowHelp(true)}
            title="操作說明"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #0070f3', background: '#fff', color: '#0070f3', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ?
          </button>
          <Link href="/trips/new" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
            + New Trip
          </Link>
        </div>
      </div>

      {trips.length === 0 && <p>No trips yet. Create your first trip!</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {trips.map((trip) => (
          <li key={trip.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <Link href={`/trips/${trip.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ margin: 0 }}>{trip.name}</h2>
              <p style={{ margin: '4px 0', color: '#666' }}>{trip.destination}</p>
              <p style={{ margin: 0, fontSize: 14 }}>{trip.startDate} – {trip.endDate}</p>
            </Link>
          </li>
        ))}
      </ul>

      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 480, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>如何使用 Travel Itinerary</h2>
              <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{step.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{i + 1}. {step.title}</div>
                    <div style={{ color: '#555', fontSize: 14, lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { Navbar } from '../../../components/Navbar';
import type { Trip } from '@travel/shared';

const CITY_OPTIONS = [
  { label: '香港', value: '香港', timezone: 'Asia/Hong_Kong' },
  { label: '東京', value: '東京', timezone: 'Asia/Tokyo' },
  { label: '台北', value: '台北', timezone: 'Asia/Taipei' },
  { label: '新加坡', value: '新加坡', timezone: 'Asia/Singapore' },
  { label: '曼谷', value: '曼谷', timezone: 'Asia/Bangkok' },
  { label: '首爾', value: '首爾', timezone: 'Asia/Seoul' },
  { label: '倫敦', value: '倫敦', timezone: 'Europe/London' },
  { label: '巴黎', value: '巴黎', timezone: 'Europe/Paris' },
  { label: '柏林', value: '柏林', timezone: 'Europe/Berlin' },
  { label: '紐約', value: '紐約', timezone: 'America/New_York' },
  { label: '洛杉磯', value: '洛杉磯', timezone: 'America/Los_Angeles' },
  { label: '雪梨', value: '雪梨', timezone: 'Australia/Sydney' },
  { label: '其他', value: '其他', timezone: '' },
];

interface DestinationRow { city: string; startDate: string; endDate: string }
const emptyRow = (): DestinationRow => ({ city: '', startDate: '', endDate: '' });

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [destinations, setDestinations] = useState<DestinationRow[]>([emptyRow()]);
  const [error, setError] = useState('');

  const inp: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
    width: '100%', boxSizing: 'border-box', fontSize: '0.875rem',
    fontFamily: 'system-ui, sans-serif', outline: 'none', color: '#111827',
  };

  const updateRow = (i: number, patch: Partial<DestinationRow>) =>
    setDestinations(prev => prev.map((r, j) => j === i ? { ...r, ...patch } : r));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = destinations.map(row => {
      const option = CITY_OPTIONS.find(o => o.value === row.city);
      const timezone = option?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      return { name: row.city, timezone, startDate: row.startDate, endDate: row.endDate };
    });
    try {
      const trip = await apiFetch<Trip>('/trips', {
        method: 'POST',
        body: JSON.stringify({ name, destinations: payload }),
      });
      router.push(`/trips/${trip.id}/orders`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Navbar>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>
          新增行程
        </h1>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', color: '#DC2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>行程名稱</label>
            <input
              placeholder="例：東京自由行"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inp}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>目的地</label>
            {destinations.map((row, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={row.city}
                    onChange={e => updateRow(i, { city: e.target.value })}
                    required
                    style={{ ...inp, flex: 1 }}
                  >
                    <option value="">選擇城市</option>
                    {CITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  {destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDestinations(d => d.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ flex: 1, fontSize: '0.78rem', color: '#6B7280' }}>
                    開始日期
                    <input type="date" value={row.startDate} onChange={e => updateRow(i, { startDate: e.target.value })} required style={{ ...inp, display: 'block', marginTop: 4 }} />
                  </label>
                  <label style={{ flex: 1, fontSize: '0.78rem', color: '#6B7280' }}>
                    結束日期
                    <input type="date" value={row.endDate} onChange={e => updateRow(i, { endDate: e.target.value })} required style={{ ...inp, display: 'block', marginTop: 4 }} />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDestinations(d => [...d, emptyRow()])}
            style={{
              padding: '10px 16px', background: '#F9FAFB',
              border: '1.5px dashed #D1D5DB', borderRadius: 10,
              cursor: 'pointer', color: '#6B7280', fontSize: '0.875rem',
            }}
          >
            ＋ 新增目的地
          </button>

          <button
            type="submit"
            style={{
              padding: '12px 0', background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: '9999px',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}
          >
            建立行程
          </button>
        </form>
      </div>
    </Navbar>
  );
}

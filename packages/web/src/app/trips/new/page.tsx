'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
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

interface DestinationRow {
  city: string;
  startDate: string;
  endDate: string;
}

const emptyRow = (): DestinationRow => ({ city: '', startDate: '', endDate: '' });

const inputStyle: React.CSSProperties = { padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [destinations, setDestinations] = useState<DestinationRow[]>([emptyRow()]);
  const [error, setError] = useState('');

  const updateRow = (index: number, patch: Partial<DestinationRow>) => {
    setDestinations(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const addRow = () => setDestinations(prev => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (destinations.length === 1) return;
    setDestinations(prev => prev.filter((_, i) => i !== index));
  };

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
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>新增行程</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          placeholder="行程名稱"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {destinations.map((row, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid #e0e0e0', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={row.city}
                  onChange={e => updateRow(i, { city: e.target.value })}
                  required
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">選擇城市</option>
                  {CITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
                    aria-label="移除目的地"
                  >
                    ×
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, fontSize: 13 }}>
                  開始日期
                  <input
                    type="date"
                    value={row.startDate}
                    onChange={e => updateRow(i, { startDate: e.target.value })}
                    required
                    style={{ ...inputStyle, display: 'block', marginTop: 4 }}
                  />
                </label>
                <label style={{ flex: 1, fontSize: 13 }}>
                  結束日期
                  <input
                    type="date"
                    value={row.endDate}
                    onChange={e => updateRow(i, { endDate: e.target.value })}
                    required
                    style={{ ...inputStyle, display: 'block', marginTop: 4 }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: 6, cursor: 'pointer', color: '#555' }}
        >
          ＋ 新增目的地
        </button>

        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          建立行程
        </button>
      </form>
    </main>
  );
}

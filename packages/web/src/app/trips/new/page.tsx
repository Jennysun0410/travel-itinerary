'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import type { Trip } from '@travel/shared';

export default function NewTripPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', destination: '', start_date: '', end_date: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const trip = await apiFetch<Trip>('/trips', { method: 'POST', body: JSON.stringify(form) });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>New Trip</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Trip name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
        <input placeholder="Destination" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
        <label>Start date<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }} /></label>
        <label>End date<input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }} /></label>
        <button type="submit" style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create Trip</button>
      </form>
    </main>
  );
}

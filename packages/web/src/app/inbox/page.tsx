'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { Order, Trip } from '@travel/shared';

export default function InboxPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});

  useEffect(() => {
    apiFetch<Order[]>('/orders/unassigned').then(setOrders).catch(console.error);
    apiFetch<Trip[]>('/trips').then(setTrips).catch(console.error);
  }, []);

  const handleAssign = async (orderId: string, tripId: string) => {
    await apiFetch(`/orders/unassigned/${orderId}/assign`, { method: 'PATCH', body: JSON.stringify({ trip_id: tripId }) });
    setOrders(o => o.filter(x => x.id !== orderId));
  };

  const handleSaveEdit = async (orderId: string) => {
    await apiFetch(`/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(editForm) });
    setOrders(o => o.map(x => x.id === orderId ? { ...x, ...editForm } : x));
    setEditingId(null);
  };

  return (
    <main style={{ padding: 24 }}>
      <h2>Inbox — Unassigned Orders</h2>
      {orders.length === 0 && <p>No unassigned orders.</p>}
      {orders.map(order => (
        <div key={order.id} style={{ border: order.flaggedForReview ? '2px solid orange' : '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          {order.flaggedForReview && <span style={{ color: 'orange', fontWeight: 600 }}>⚠ Review required — some fields may be missing</span>}
          {editingId === order.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder="Vendor" value={editForm.vendor ?? order.vendor} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Booking ref" value={editForm.bookingRef ?? order.bookingRef} onChange={e => setEditForm(f => ({ ...f, bookingRef: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Price" type="number" value={editForm.price ?? order.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleSaveEdit(order.id)} style={{ padding: '6px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <strong>{order.vendor || 'Unknown vendor'}</strong> — {order.type}
              <p style={{ margin: '4px 0', color: '#666' }}>Ref: {order.bookingRef || '—'} | {order.price} {order.currency}</p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>{order.startDatetime} – {order.endDatetime}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <button onClick={() => { setEditingId(order.id); setEditForm({}); }} style={{ padding: '4px 10px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                <select onChange={e => e.target.value && handleAssign(order.id, e.target.value)} defaultValue="">
                  <option value="">Assign to trip…</option>
                  {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      ))}
    </main>
  );
}

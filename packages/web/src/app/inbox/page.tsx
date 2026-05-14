'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { AppLayout, useSidebar } from '../../components/AppLayout';
import { useI18n } from '../../lib/i18n';
import type { Order, Trip } from '@travel/shared';

const S = {
  bg: '#f4f4f5',
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
} as const;

const TYPE_ICON: Record<string, string> = { flight: '✈️', accommodation: '🏨', activity: '🎫' };

export default function InboxPage() {
  const { t } = useI18n();
  const { openSidebar } = useSidebar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});

  const inp: React.CSSProperties = {
    padding: '8px 11px', borderRadius: 7, border: `1px solid ${S.border}`,
    fontSize: 13, fontFamily: 'system-ui, sans-serif', background: S.surface, color: S.text,
  };

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
    <AppLayout>
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '0 20px 48px', flex: 1 }}>

        {/* Top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '8px 0 20px', borderBottom: `1px solid ${S.border}`,
          marginBottom: 24,
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
        </header>

        <h1 style={{ margin: '0 0 20px', fontSize: '1.4rem', fontWeight: 800, color: S.text, letterSpacing: '-0.02em' }}>
          {t('navInbox')}
        </h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: S.muted }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>No unassigned orders.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(order => (
              <div key={order.id} style={{
                background: S.surface,
                border: order.flaggedForReview ? '1.5px solid #F59E0B' : `1px solid ${S.border}`,
                borderRadius: 12, padding: '14px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                {order.flaggedForReview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                    <span>⚠</span> Review required — some fields may be missing
                  </div>
                )}
                {editingId === order.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input placeholder="Vendor" value={editForm.vendor ?? order.vendor} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} style={inp} />
                    <input placeholder="Booking ref" value={editForm.bookingRef ?? order.bookingRef} onChange={e => setEditForm(f => ({ ...f, bookingRef: e.target.value }))} style={inp} />
                    <input placeholder="Price" type="number" value={editForm.price ?? order.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} style={inp} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleSaveEdit(order.id)} style={{ padding: '7px 18px', background: S.text, color: S.surface, border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '7px 14px', border: `1px solid ${S.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 13, background: S.surface }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span>{TYPE_ICON[order.type] ?? '📄'}</span>
                        <strong style={{ fontSize: '0.95rem', color: S.text }}>{order.vendor || 'Unknown vendor'}</strong>
                        <span style={{ fontSize: 11, background: S.bg, color: S.muted, padding: '2px 8px', borderRadius: 10 }}>{order.type}</span>
                      </div>
                      <p style={{ margin: '0 0 2px', color: S.muted, fontSize: 12 }}>
                        {order.bookingRef ? `${order.bookingRef} · ` : ''}{order.price} {order.currency}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1' }}>{order.startDatetime?.slice(0, 10)} – {order.endDatetime?.slice(0, 10)}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditingId(order.id); setEditForm({}); }} style={{ padding: '5px 12px', border: `1px solid ${S.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 12, background: S.surface }}>Edit</button>
                      </div>
                      <select
                        onChange={e => e.target.value && handleAssign(order.id, e.target.value)}
                        defaultValue=""
                        style={{ ...inp, fontSize: 12, padding: '5px 10px', cursor: 'pointer' }}
                      >
                        <option value="">Assign to trip…</option>
                        {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

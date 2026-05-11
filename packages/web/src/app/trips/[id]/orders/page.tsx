'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api';
import type { EmailConnection, Order, OrderType } from '@travel/shared';

interface Props { params: { id: string } }

const TYPES: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Flights', value: 'flight' },
  { label: 'Accommodations', value: 'accommodation' },
  { label: 'Activities', value: 'activity' },
];

const emptyForm = { type: 'activity' as OrderType, vendor: '', booking_ref: '', start_datetime: '', end_datetime: '', price: 0, currency: 'USD' };

export default function OrdersPage({ params }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [addMode, setAddMode] = useState<null | 'email' | 'manual'>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [scanFrom, setScanFrom] = useState('');
  const [scanTo, setScanTo] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const loadOrders = (type = filter) => {
    const qs = type ? `?type=${type}` : '';
    apiFetch<Order[]>(`/orders/trips/${params.id}/orders${qs}`).then(setOrders).catch(console.error);
  };

  useEffect(() => {
    loadOrders();
    apiFetch<EmailConnection[]>('/email/connections')
      .then(conns => setGmailConnected(conns.some(c => c.provider === 'gmail')))
      .catch(console.error);
  }, [params.id]);

  const handleFilterChange = (type: string) => { setFilter(type); loadOrders(type); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = await apiFetch<Order>(`/orders/trips/${params.id}/orders`, { method: 'POST', body: JSON.stringify(form) });
    setOrders(o => [...o, order]);
    setAddMode(null);
    setForm({ ...emptyForm });
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    setScanResult(null);
    try {
      const result = await apiFetch<{ imported: number; skipped: number }>('/email/gmail/scan', {
        method: 'POST',
        body: JSON.stringify({ from: scanFrom, to: scanTo, trip_id: params.id }),
      });
      setScanResult(`已匯入 ${result.imported} 筆訂單${result.skipped > 0 ? `，略過 ${result.skipped} 筆重複` : ''}`);
      loadOrders();
    } catch (err) {
      setScanResult(`匯入失敗：${(err as Error).message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const updated = await apiFetch<Order>(`/orders/${editingId}`, { method: 'PATCH', body: JSON.stringify(editForm) });
    setOrders(o => o.map(x => x.id === editingId ? updated : x));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    await apiFetch(`/orders/${id}`, { method: 'DELETE' });
    setOrders(o => o.filter(x => x.id !== id));
  };

  const handleConfirm = async (id: string) => {
    await apiFetch(`/orders/${id}/confirm`, { method: 'PATCH' });
    setOrders(o => o.map(x => x.id === id ? { ...x, flaggedForReview: false } : x));
  };

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Orders</h2>
        <button
          onClick={() => { setAddMode(null); setScanResult(null); }}
          style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          + Add Order
        </button>
      </div>

      {/* Mode selector */}
      {addMode === null && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setAddMode('email')} style={{ padding: '8px 16px', border: '1px solid #0070f3', borderRadius: 6, background: '#fff', color: '#0070f3', cursor: 'pointer' }}>從信箱匯入</button>
          <button onClick={() => setAddMode('manual')} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, background: '#fff', color: '#333', cursor: 'pointer' }}>手動新增</button>
        </div>
      )}

      {/* Email import panel */}
      {addMode === 'email' && (
        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          {!gmailConnected ? (
            <p style={{ margin: 0 }}>尚未連結 Gmail — <a href="/settings/email" onClick={() => sessionStorage.setItem('gmailReturnUrl', window.location.pathname)} style={{ color: '#0070f3' }}>前往設定</a></p>
          ) : (
            <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, fontSize: 13 }}>開始日期<input type="date" value={scanFrom} onChange={e => setScanFrom(e.target.value)} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%', marginTop: 4 }} /></label>
                <label style={{ flex: 1, fontSize: 13 }}>結束日期<input type="date" value={scanTo} onChange={e => setScanTo(e.target.value)} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%', marginTop: 4 }} /></label>
              </div>
              {scanResult && <p style={{ margin: 0, fontSize: 13, color: scanResult.includes('失敗') ? 'red' : '#0a7c3e' }}>{scanResult}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={scanning} style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: scanning ? 0.6 : 1 }}>{scanning ? '匯入中…' : '開始匯入'}</button>
                <button type="button" onClick={() => { setAddMode(null); setScanResult(null); }} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>取消</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => handleFilterChange(t.value)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #ccc', background: filter === t.value ? '#0070f3' : '#fff', color: filter === t.value ? '#fff' : '#333', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Manual add form */}
      {addMode === 'manual' && (
        <form onSubmit={handleAdd} style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as OrderType }))} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="flight">Flight</option>
            <option value="accommodation">Accommodation</option>
            <option value="activity">Activity</option>
          </select>
          <input placeholder="Vendor" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <input placeholder="Booking ref" value={form.booking_ref} onChange={e => setForm(f => ({ ...f, booking_ref: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <label>Start<input type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }} /></label>
          <label>End<input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #ccc', width: '100%' }} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <input placeholder="Currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={{ width: 80, padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={() => setAddMode(null)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Order list */}
      {orders.length === 0 && <p style={{ color: '#999' }}>No orders yet.</p>}
      {orders.map(order => (
        <div key={order.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 10 }}>
          {editingId === order.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder="Vendor" defaultValue={order.vendor} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              <input placeholder="Booking ref" defaultValue={order.bookingRef} onChange={e => setEditForm(f => ({ ...f, bookingRef: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveEdit} style={{ padding: '6px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{order.vendor}</strong>{order.flaggedForReview && <span onClick={() => handleConfirm(order.id)} style={{ marginLeft: 8, background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>待確認</span>} — <em>{order.type}</em>
                <p style={{ margin: '2px 0', color: '#666', fontSize: 13 }}>Ref: {order.bookingRef || '—'} | {order.price} {order.currency}</p>
                <p style={{ margin: '2px 0', fontSize: 13 }}>{order.startDatetime} – {order.endDatetime}</p>
                <p style={{ margin: '2px 0', fontSize: 12, color: '#999' }}>Added by {order.createdByName}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => { setEditingId(order.id); setEditForm({}); }} style={{ padding: '4px 10px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(order.id)} style={{ padding: '4px 10px', color: 'red', border: '1px solid #fcc', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}

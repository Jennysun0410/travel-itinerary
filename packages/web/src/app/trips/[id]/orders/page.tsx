'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api';
import type { EmailConnection, Order, OrderType } from '@travel/shared';

interface Props { params: { id: string } }

interface ParsedOrder {
  raw_email_id: string;
  type: 'flight' | 'accommodation' | 'activity';
  vendor: string;
  booking_ref: string;
  start_datetime: string;
  end_datetime: string;
  price: number;
  currency: string;
  flagged_for_review: boolean;
}

const TYPES: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Flights', value: 'flight' },
  { label: 'Accommodations', value: 'accommodation' },
  { label: 'Activities', value: 'activity' },
];

const TYPE_LABEL: Record<string, string> = { flight: '機票', accommodation: '住宿', activity: '活動' };

const emptyForm = { type: 'activity' as OrderType, vendor: '', booking_ref: '', start_datetime: '', end_datetime: '', price: 0, currency: 'USD' };

const STEPS = ['選擇日期', '掃描信箱', '確認訂單', '加入行程'];

// ── Modal ────────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                background: done ? '#0070f3' : active ? '#0070f3' : '#e5e7eb',
                color: done || active ? '#fff' : '#9ca3af',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: active ? '#0070f3' : done ? '#6b7280' : '#9ca3af', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#0070f3' : '#e5e7eb', margin: '0 6px', marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ModalProps {
  tripId: string;
  gmailConnected: boolean;
  initialStep?: number;
  initialOrders?: ParsedOrder[];
  onClose: () => void;
  onImported: () => void;
}

function ImportModal({ tripId, gmailConnected, initialStep = 0, initialOrders = [], onClose, onImported }: ModalProps) {
  const [step, setStep] = useState(initialStep);
  const [scanFrom, setScanFrom] = useState('');
  const [scanTo, setScanTo] = useState('');
  const [previewOrders, setPreviewOrders] = useState<ParsedOrder[]>(initialOrders);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialOrders.map(o => o.raw_email_id)));
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(1);
    try {
      const results = await apiFetch<ParsedOrder[]>('/email/gmail/preview', {
        method: 'POST',
        body: JSON.stringify({ from: scanFrom, to: scanTo, trip_id: tripId }),
      });
      setPreviewOrders(results);
      setSelectedIds(new Set(results.map(o => o.raw_email_id)));
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
      setStep(0);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const selected = previewOrders.filter(o => selectedIds.has(o.raw_email_id));
      const result = await apiFetch<{ imported: number }>('/email/gmail/import', {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId, orders: selected }),
      });
      setImportedCount(result.imported);
      setStep(3);
      onImported();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const toggleId = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => setSelectedIds(
    selectedIds.size === previewOrders.length ? new Set() : new Set(previewOrders.map(o => o.raw_email_id))
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '90%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>從信箱匯入訂單</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>

        <StepBar current={step} />

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Step 0: Date range */}
          {step === 0 && (
            <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!gmailConnected && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 12, fontSize: 13 }}>
                  尚未連結 Gmail —{' '}
                  <a href="/settings/email" style={{ color: '#0070f3' }}>前往設定</a>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                  開始日期
                  <input type="date" value={scanFrom} onChange={e => setScanFrom(e.target.value)} required
                    style={{ display: 'block', marginTop: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontSize: 14 }} />
                </label>
                <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                  結束日期
                  <input type="date" value={scanTo} onChange={e => setScanTo(e.target.value)} required
                    style={{ display: 'block', marginTop: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontSize: 14 }} />
                </label>
              </div>
              {error && <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="submit" disabled={!gmailConnected}
                  style={{ flex: 1, padding: '10px 0', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: !gmailConnected ? 0.5 : 1 }}>
                  開始掃描
                </button>
                <button type="button" onClick={onClose}
                  style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff' }}>
                  取消
                </button>
              </div>
            </form>
          )}

          {/* Step 1: Scanning */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '32px 0' }}>
              <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#0070f3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>正在掃描信箱中的訂單確認信…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {previewOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280', fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                  未找到符合條件的訂單確認信
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>找到 {previewOrders.length} 筆，已選 {selectedIds.size} 筆</span>
                    <button onClick={toggleAll} style={{ fontSize: 12, padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
                      {selectedIds.size === previewOrders.length ? '取消全選' : '全選'}
                    </button>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    {previewOrders.map((order, i) => (
                      <label key={order.raw_email_id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer',
                        borderTop: i > 0 ? '1px solid #f3f4f6' : undefined,
                        background: selectedIds.has(order.raw_email_id) ? '#f0f7ff' : '#fff',
                      }}>
                        <input type="checkbox" checked={selectedIds.has(order.raw_email_id)} onChange={() => toggleId(order.raw_email_id)} style={{ flexShrink: 0, width: 16, height: 16 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{order.vendor || '(未知供應商)'}</span>
                            <span style={{ fontSize: 11, background: '#e5e7eb', color: '#6b7280', padding: '1px 7px', borderRadius: 10 }}>{TYPE_LABEL[order.type] ?? order.type}</span>
                            {order.flagged_for_review && <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: 10 }}>待確認</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                            {order.start_datetime.slice(0, 10)}{order.booking_ref ? ` · ${order.booking_ref}` : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                          {order.price.toLocaleString()} {order.currency}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
              {error && <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {previewOrders.length > 0 && (
                  <button onClick={handleImport} disabled={importing || selectedIds.size === 0}
                    style={{ flex: 1, padding: '10px 0', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (importing || selectedIds.size === 0) ? 0.5 : 1 }}>
                    {importing ? '加入中…' : `加入行程 (${selectedIds.size} 筆)`}
                  </button>
                )}
                <button onClick={onClose}
                  style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff' }}>
                  {previewOrders.length === 0 ? '關閉' : '取消'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✓</div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#065f46' }}>成功加入 {importedCount} 筆訂單</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>訂單已顯示在行程總覽與分類中</p>
              <button onClick={onClose}
                style={{ marginTop: 8, padding: '10px 32px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                完成
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage({ params }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [demoOrders, setDemoOrders] = useState<ParsedOrder[] | null>(null);
  const [demoStep, setDemoStep] = useState(0);

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

  const openDemo = () => {
    const demo: ParsedOrder[] = [
      { raw_email_id: 'demo-1', type: 'flight', vendor: 'EVA Air', booking_ref: 'BR801TW', start_datetime: '2026-06-10T08:30:00+08:00', end_datetime: '2026-06-10T13:45:00+09:00', price: 8500, currency: 'TWD', flagged_for_review: false },
      { raw_email_id: 'demo-2', type: 'accommodation', vendor: 'Agoda / 台北君悅酒店', booking_ref: 'AGD-990321', start_datetime: '2026-06-10T15:00:00+08:00', end_datetime: '2026-06-12T11:00:00+08:00', price: 6800, currency: 'TWD', flagged_for_review: false },
      { raw_email_id: 'demo-3', type: 'activity', vendor: 'Klook 故宮導覽', booking_ref: '', start_datetime: '2026-06-11T10:00:00+08:00', end_datetime: '2026-06-11T12:00:00+08:00', price: 650, currency: 'TWD', flagged_for_review: true },
    ];
    setDemoOrders(demo);
    setDemoStep(2);
    setShowImportModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = await apiFetch<Order>(`/orders/trips/${params.id}/orders`, { method: 'POST', body: JSON.stringify(form) });
    setOrders(o => [...o, order]);
    setShowManual(false);
    setForm({ ...emptyForm });
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

  const closeModal = () => { setShowImportModal(false); setDemoOrders(null); setDemoStep(0); };

  return (
    <main style={{ padding: 24 }}>
      {/* Modal */}
      {showImportModal && (
        <ImportModal
          tripId={params.id}
          gmailConnected={gmailConnected}
          initialStep={demoStep}
          initialOrders={demoOrders ?? []}
          onClose={closeModal}
          onImported={loadOrders}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Orders</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openDemo} style={{ padding: '8px 14px', background: '#fff', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>示範預覽</button>
          <button onClick={() => setShowImportModal(true)} style={{ padding: '8px 14px', border: '1px solid #0070f3', color: '#0070f3', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>從信箱匯入</button>
          <button onClick={() => setShowManual(v => !v)} style={{ padding: '8px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>+ 手動新增</button>
        </div>
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => { setFilter(t.value); loadOrders(t.value); }}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: filter === t.value ? '#0070f3' : '#fff', color: filter === t.value ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Manual add form */}
      {showManual && (
        <form onSubmit={handleAdd} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #e5e7eb' }}>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as OrderType }))} style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}>
            <option value="flight">Flight</option>
            <option value="accommodation">Accommodation</option>
            <option value="activity">Activity</option>
          </select>
          <input placeholder="Vendor" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} required style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }} />
          <input placeholder="Booking ref" value={form.booking_ref} onChange={e => setForm(f => ({ ...f, booking_ref: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }} />
          <label style={{ fontSize: 13 }}>Start<input type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #d1d5db', width: '100%', marginTop: 4 }} /></label>
          <label style={{ fontSize: 13 }}>End<input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} required style={{ display: 'block', padding: 8, borderRadius: 4, border: '1px solid #d1d5db', width: '100%', marginTop: 4 }} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }} />
            <input placeholder="Currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={{ width: 80, padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={() => setShowManual(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Order list */}
      {orders.length === 0 && <p style={{ color: '#9ca3af' }}>No orders yet.</p>}
      {orders.map(order => (
        <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 10 }}>
          {editingId === order.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder="Vendor" defaultValue={order.vendor} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #d1d5db' }} />
              <input placeholder="Booking ref" defaultValue={order.bookingRef} onChange={e => setEditForm(f => ({ ...f, bookingRef: e.target.value }))} style={{ padding: 6, borderRadius: 4, border: '1px solid #d1d5db' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveEdit} style={{ padding: '6px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{order.vendor}</strong>
                {order.flaggedForReview && (
                  <span onClick={() => handleConfirm(order.id)} style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>待確認</span>
                )}
                {' — '}<em style={{ color: '#6b7280' }}>{order.type}</em>
                <p style={{ margin: '3px 0', color: '#6b7280', fontSize: 13 }}>Ref: {order.bookingRef || '—'} | {order.price} {order.currency}</p>
                <p style={{ margin: '3px 0', fontSize: 13 }}>{order.startDatetime} – {order.endDatetime}</p>
                <p style={{ margin: '3px 0', fontSize: 12, color: '#9ca3af' }}>Added by {order.createdByName}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => { setEditingId(order.id); setEditForm({}); }} style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Edit</button>
                <button onClick={() => handleDelete(order.id)} style={{ padding: '4px 10px', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}

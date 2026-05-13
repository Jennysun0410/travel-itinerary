'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api';
import { TripPageShell } from '../../../../components/TripPageShell';
import type { EmailConnection, Order } from '@travel/shared';

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
  { label: 'Stays', value: 'accommodation' },
  { label: 'Activities', value: 'activity' },
];

const TYPE_LABEL: Record<string, string> = { flight: '機票', accommodation: '住宿', activity: '活動' };
const TYPE_ICON: Record<string, string> = { flight: '✈️', accommodation: '🏨', activity: '🎫' };
const STEPS = ['選擇日期', '掃描信箱', '確認訂單', '加入行程', '加入成功'];

// ── Design tokens ──────────────────────────────────────────────────────────────
const P = '#2563EB';
const P_LIGHT = '#EFF6FF';
const P_BORDER = '#BFDBFE';

// ── Illustrations ──────────────────────────────────────────────────────────────

function IllustCalendar() {
  return (
    <svg viewBox="0 0 160 112" width="140" height="98" style={{ display: 'block', margin: '0 auto 16px' }}>
      <rect x="12" y="22" width="136" height="84" rx="10" fill="white" stroke={P_BORDER} strokeWidth="2"/>
      <rect x="12" y="22" width="136" height="28" rx="10" fill={P}/>
      <rect x="12" y="38" width="136" height="12" fill={P}/>
      <rect x="46" y="13" width="9" height="20" rx="4.5" fill="#93C5FD"/>
      <rect x="105" y="13" width="9" height="20" rx="4.5" fill="#93C5FD"/>
      <text x="80" y="39" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="sans-serif">2026年6月</text>
      {[28,45,62,79,96,113,130].map(x => <circle key={x} cx={x} cy={63} r="3" fill="#E5E7EB"/>)}
      <circle cx="28" cy="84" r="3" fill="#E5E7EB"/>
      <rect x="45" y="78" width="85" height="12" rx="6" fill="#DBEAFE"/>
      {[62,79,96].map(x => <circle key={x} cx={x} cy={84} r="3.5" fill={P_BORDER}/>)}
      <circle cx="45" cy="84" r="12" fill={P}/>
      <text x="45" y="88" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="sans-serif">8</text>
      <circle cx="130" cy="84" r="12" fill={P}/>
      <text x="130" y="88" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="sans-serif">14</text>
      {[28,45,62].map(x => <circle key={x} cx={x} cy={105} r="3" fill="#E5E7EB"/>)}
    </svg>
  );
}

function IllustEmail() {
  return (
    <svg viewBox="0 0 160 100" width="140" height="88" style={{ display: 'block', margin: '0 auto 16px' }}>
      <rect x="14" y="16" width="86" height="66" rx="8" fill="white" stroke={P_BORDER} strokeWidth="2"/>
      <path d="M14 16 L57 48 L100 16" fill="none" stroke={P_BORDER} strokeWidth="2"/>
      <line x1="28" y1="62" x2="86" y2="62" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round"/>
      <line x1="28" y1="72" x2="72" y2="72" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="126" cy="56" r="27" fill="white" stroke="#DBEAFE" strokeWidth="1.5"/>
      <circle cx="124" cy="54" r="18" fill={P_LIGHT} stroke={P} strokeWidth="2.5"/>
      <line x1="137" y1="67" x2="149" y2="79" stroke={P} strokeWidth="3.5" strokeLinecap="round"/>
      <text x="124" y="59" textAnchor="middle" fill={P} fontSize="14" fontWeight="700" fontFamily="sans-serif">@</text>
    </svg>
  );
}

function IllustAdding() {
  return (
    <svg viewBox="0 0 180 112" width="160" height="100" style={{ display: 'block', margin: '0 auto 16px' }}>
      <rect x="8" y="36" width="58" height="42" rx="8" fill={P_LIGHT} stroke={P} strokeWidth="2" strokeDasharray="5 3"/>
      <text x="37" y="54" textAnchor="middle" fill={P} fontSize="10" fontWeight="700" fontFamily="sans-serif">新訂單</text>
      <text x="37" y="70" textAnchor="middle" fill="#93C5FD" fontSize="14" fontFamily="sans-serif">✈</text>
      <line x1="70" y1="57" x2="96" y2="57" stroke={P} strokeWidth="3" strokeLinecap="round"/>
      <path d="M91 50 L99 57 L91 64" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="102" y="10" width="70" height="94" rx="10" fill="white" stroke="#A7F3D0" strokeWidth="2"/>
      <rect x="102" y="10" width="70" height="24" rx="10" fill="#10B981"/>
      <rect x="102" y="24" width="70" height="10" fill="#10B981"/>
      <text x="137" y="26" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="sans-serif">我的行程</text>
      <rect x="112" y="42" width="50" height="8" rx="4" fill="#D1FAE5"/>
      <rect x="112" y="54" width="42" height="8" rx="4" fill="#D1FAE5"/>
      <rect x="112" y="66" width="46" height="8" rx="4" fill="#DBEAFE" opacity="0.7"/>
      <circle cx="162" cy="19" r="12" fill="#F59E0B" stroke="white" strokeWidth="2"/>
      <text x="162" y="23" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="sans-serif">+1</text>
    </svg>
  );
}

function IllustSuccess({ count }: { count: number }) {
  function star(cx: number, cy: number, r: number, color: string) {
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.42;
      return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return <polygon key={`${cx}${cy}`} points={pts} fill={color}/>;
  }
  return (
    <svg viewBox="0 0 180 142" width="160" height="126" style={{ display: 'block', margin: '0 auto 10px' }}>
      {star(22, 30, 7, '#FCD34D')}{star(156, 24, 5, '#FCD34D')}{star(163, 74, 4, '#A7F3D0')}
      <circle cx="90" cy="52" r="46" fill="#D1FAE5" opacity="0.4"/>
      <circle cx="90" cy="52" r="35" fill="#10B981"/>
      <path d="M74 52 L86 64 L109 40" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="20" y="100" width="140" height="38" rx="9" fill="white" stroke="#A7F3D0" strokeWidth="1.5"/>
      <rect x="20" y="100" width="140" height="18" rx="9" fill="#ECFDF5"/>
      <rect x="20" y="108" width="140" height="10" fill="#ECFDF5"/>
      <text x="36" y="114" fill="#065F46" fontSize="8" fontWeight="700" fontFamily="sans-serif">我的行程</text>
      <rect x="30" y="122" width="62" height="8" rx="4" fill="#D1FAE5"/>
      <rect x="30" y="130" width="46" height="6" rx="3" fill="#D1FAE5" opacity="0.6"/>
      <rect x="128" y="116" width="24" height="16" rx="8" fill="#10B981"/>
      <text x="140" y="128" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="sans-serif">+{count}</text>
    </svg>
  );
}

// ── StepBar ────────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                background: done || active ? P : '#E5E7EB',
                color: done || active ? '#fff' : '#9CA3AF',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? P : done ? '#6B7280' : '#9CA3AF', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? P : '#E5E7EB', margin: '0 4px', marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── ImportFlow ─────────────────────────────────────────────────────────────────

interface ImportFlowProps {
  tripId: string;
  gmailConnected: boolean;
  onCancel: () => void;
  onClose: () => void;
}

function ImportFlow({ tripId, gmailConnected, onCancel, onClose }: ImportFlowProps) {
  const [step, setStep] = useState(0);
  const [scanFrom, setScanFrom] = useState('');
  const [scanTo, setScanTo] = useState('');
  const [previewOrders, setPreviewOrders] = useState<ParsedOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowForm, setEditRowForm] = useState<Partial<ParsedOrder>>({});
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inp: React.CSSProperties = { padding: '7px 10px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 13, width: '100%', boxSizing: 'border-box' as const };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setStep(1);
    try {
      const results = await apiFetch<ParsedOrder[]>('/email/gmail/preview', {
        method: 'POST',
        body: JSON.stringify({ from: scanFrom, to: scanTo, trip_id: tripId }),
      });
      setPreviewOrders(results);
      setSelectedIds(new Set(results.map(o => o.raw_email_id)));
      setStep(2);
    } catch (err) { setError((err as Error).message); setStep(0); }
  };

  const handleImport = async () => {
    const selected = previewOrders.filter(o => selectedIds.has(o.raw_email_id));
    setImporting(true); setError(null); setStep(3);
    try {
      const result = await apiFetch<{ imported: number }>('/email/gmail/import', {
        method: 'POST', body: JSON.stringify({ trip_id: tripId, orders: selected }),
      });
      setImportedCount(result.imported); setStep(4);
    } catch (err) { setError((err as Error).message); setStep(2); }
    finally { setImporting(false); }
  };

  const toggleId = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelectedIds(selectedIds.size === previewOrders.length ? new Set() : new Set(previewOrders.map(o => o.raw_email_id)));

  const startEditRow = (o: ParsedOrder) => {
    setEditingRowId(o.raw_email_id);
    setEditRowForm({ vendor: o.vendor, type: o.type, booking_ref: o.booking_ref, start_datetime: o.start_datetime.slice(0, 16), end_datetime: o.end_datetime.slice(0, 16), price: o.price, currency: o.currency });
  };

  const saveEditRow = (id: string) => {
    setPreviewOrders(orders => orders.map(o => o.raw_email_id !== id ? o : {
      ...o, vendor: editRowForm.vendor ?? o.vendor, type: (editRowForm.type as ParsedOrder['type']) ?? o.type,
      booking_ref: editRowForm.booking_ref ?? o.booking_ref, start_datetime: editRowForm.start_datetime ?? o.start_datetime,
      end_datetime: editRowForm.end_datetime ?? o.end_datetime, price: Number(editRowForm.price ?? o.price), currency: editRowForm.currency ?? o.currency,
    }));
    setEditingRowId(null);
  };

  const removeRow = (id: string) => {
    setPreviewOrders(orders => orders.filter(o => o.raw_email_id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const btnPrimary: React.CSSProperties = { padding: '10px 0', background: P, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 };
  const btnSecondary: React.CSSProperties = { padding: '10px 18px', border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 14, cursor: 'pointer', background: '#fff', color: '#374151' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <StepBar current={step} />
      <div style={{ overflowY: 'auto' }}>

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <IllustCalendar />
            <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!gmailConnected && (
                <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, fontSize: 13 }}>
                  尚未連結 Gmail — <a href="/settings/email" style={{ color: P }}>前往設定</a>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>開始日期
                  <input type="date" value={scanFrom} onChange={e => setScanFrom(e.target.value)} required style={{ display: 'block', marginTop: 6, ...inp }} />
                </label>
                <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>結束日期
                  <input type="date" value={scanTo} onChange={e => setScanTo(e.target.value)} required style={{ display: 'block', marginTop: 6, ...inp }} />
                </label>
              </div>
              {error && <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={onCancel} style={btnSecondary}>取消</button>
                <button type="submit" disabled={!gmailConnected} style={{ ...btnPrimary, opacity: !gmailConnected ? 0.5 : 1 }}>開始掃描 →</button>
              </div>
            </form>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
            <IllustEmail />
            <div style={{ width: 36, height: 36, border: `4px solid #E5E7EB`, borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>正在掃描信箱中的訂單確認信…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {previewOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>未找到符合條件的訂單確認信
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>找到 {previewOrders.length} 筆，已選 {selectedIds.size} 筆</span>
                  <button onClick={toggleAll} style={{ fontSize: 12, padding: '4px 12px', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', background: '#fff' }}>
                    {selectedIds.size === previewOrders.length ? '取消全選' : '全選'}
                  </button>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  {previewOrders.map((order, i) => (
                    <div key={order.raw_email_id} style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : undefined, background: editingRowId === order.raw_email_id ? '#F9FAFB' : selectedIds.has(order.raw_email_id) ? P_LIGHT : '#fff' }}>
                      {editingRowId === order.raw_email_id ? (
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input placeholder="供應商" value={editRowForm.vendor ?? ''} onChange={e => setEditRowForm(f => ({ ...f, vendor: e.target.value }))} style={{ ...inp, flex: 2 }} />
                            <select value={editRowForm.type ?? order.type} onChange={e => setEditRowForm(f => ({ ...f, type: e.target.value as ParsedOrder['type'] }))} style={{ ...inp, flex: 1 }}>
                              <option value="flight">機票</option><option value="accommodation">住宿</option><option value="activity">活動</option>
                            </select>
                          </div>
                          <input placeholder="訂單編號" value={editRowForm.booking_ref ?? ''} onChange={e => setEditRowForm(f => ({ ...f, booking_ref: e.target.value }))} style={inp} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <label style={{ flex: 1, fontSize: 12, color: '#6B7280' }}>開始時間
                              <input type="datetime-local" value={editRowForm.start_datetime ?? ''} onChange={e => setEditRowForm(f => ({ ...f, start_datetime: e.target.value }))} style={{ display: 'block', marginTop: 2, ...inp }} />
                            </label>
                            <label style={{ flex: 1, fontSize: 12, color: '#6B7280' }}>結束時間
                              <input type="datetime-local" value={editRowForm.end_datetime ?? ''} onChange={e => setEditRowForm(f => ({ ...f, end_datetime: e.target.value }))} style={{ display: 'block', marginTop: 2, ...inp }} />
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="number" placeholder="價格" value={editRowForm.price ?? ''} onChange={e => setEditRowForm(f => ({ ...f, price: Number(e.target.value) }))} style={{ ...inp, flex: 2 }} />
                            <input placeholder="幣別" value={editRowForm.currency ?? ''} onChange={e => setEditRowForm(f => ({ ...f, currency: e.target.value }))} style={{ ...inp, flex: 1 }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => saveEditRow(order.raw_email_id)} style={{ padding: '6px 18px', background: P, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>儲存</button>
                            <button onClick={() => setEditingRowId(null)} style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, cursor: 'pointer', background: '#fff' }}>取消</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                          <input type="checkbox" checked={selectedIds.has(order.raw_email_id)} onChange={() => toggleId(order.raw_email_id)} style={{ flexShrink: 0, width: 16, height: 16, cursor: 'pointer', accentColor: P }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{order.vendor || '(未知供應商)'}</span>
                              <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '1px 7px', borderRadius: 10 }}>{TYPE_LABEL[order.type] ?? order.type}</span>
                              {order.flagged_for_review && <span style={{ fontSize: 11, background: '#FFFBEB', color: '#92400E', padding: '1px 7px', borderRadius: 10 }}>待確認</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{order.start_datetime.slice(0, 10)}{order.booking_ref ? ` · ${order.booking_ref}` : ''}</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{order.price.toLocaleString()} {order.currency}</div>
                          <button onClick={() => startEditRow(order)} style={{ flexShrink: 0, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff', color: '#374151' }}>✏</button>
                          <button onClick={() => removeRow(order.raw_email_id)} style={{ flexShrink: 0, padding: '4px 8px', border: '1px solid #FECACA', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff', color: '#DC2626' }}>✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            {error && <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onCancel} style={btnSecondary}>← 返回</button>
              {previewOrders.length > 0 ? (
                <button onClick={handleImport} disabled={selectedIds.size === 0 || importing} style={{ ...btnPrimary, opacity: selectedIds.size === 0 ? 0.5 : 1 }}>加入行程 ({selectedIds.size} 筆)</button>
              ) : (
                <button onClick={onCancel} style={btnPrimary}>關閉</button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
            <IllustAdding />
            <div style={{ width: 36, height: 36, border: '4px solid #E5E7EB', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>正在將訂單加入行程中…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <IllustSuccess count={importedCount} />
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#065F46' }}>加入成功！</p>
            <p style={{ margin: 0, fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6 }}>已新增 {importedCount} 筆訂單<br/><span style={{ color: '#374151', fontWeight: 500 }}>訂單會出現在你的行程中</span></p>
            <button onClick={onClose} style={{ marginTop: 12, padding: '11px 44px', background: P, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>完成</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AddOrdersModal ──────────────────────────────────────────────────────────────

interface AddOrdersModalProps {
  tripId: string;
  gmailConnected: boolean;
  initialOrders: Order[];
  onClose: () => void;
}

function AddOrdersModal({ tripId, gmailConnected, initialOrders, onClose }: AddOrdersModalProps) {
  const [localOrders, setLocalOrders] = useState<Order[]>(initialOrders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [manualForm, setManualForm] = useState({ type: 'flight', vendor: '', booking_ref: '', start_datetime: '', end_datetime: '', price: '', currency: 'USD' });
  const [manualSaving, setManualSaving] = useState(false);
  const [showScanForm, setShowScanForm] = useState(false);
  const [scanFrom, setScanFrom] = useState('');
  const [scanTo, setScanTo] = useState('');
  const [scanning, setScanning] = useState(false);
  const [previewOrders, setPreviewOrders] = useState<ParsedOrder[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const inp: React.CSSProperties = { padding: '8px 11px', borderRadius: 7, border: '1px solid #D1D5DB', fontSize: 13, width: '100%', boxSizing: 'border-box' as const };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setManualSaving(true);
    try {
      const newOrder = await apiFetch<Order>(`/orders/trips/${tripId}/orders`, {
        method: 'POST', body: JSON.stringify({ ...manualForm, price: Number(manualForm.price) }),
      });
      setLocalOrders(o => [newOrder, ...o]);
      setManualForm({ type: 'flight', vendor: '', booking_ref: '', start_datetime: '', end_datetime: '', price: '', currency: 'USD' });
    } catch (err) { alert((err as Error).message); }
    finally { setManualSaving(false); }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault(); setScanError(null); setScanning(true); setPreviewOrders(null);
    try {
      const results = await apiFetch<ParsedOrder[]>('/email/gmail/preview', {
        method: 'POST', body: JSON.stringify({ from: scanFrom, to: scanTo, trip_id: tripId }),
      });
      setPreviewOrders(results);
      setSelectedIds(new Set(results.map(o => o.raw_email_id)));
    } catch (err) { setScanError((err as Error).message); }
    finally { setScanning(false); }
  };

  const handleImport = async () => {
    if (!previewOrders) return;
    const selected = previewOrders.filter(o => selectedIds.has(o.raw_email_id));
    setImporting(true);
    try {
      await apiFetch<{ imported: number }>('/email/gmail/import', { method: 'POST', body: JSON.stringify({ trip_id: tripId, orders: selected }) });
      onClose();
    } catch (err) { alert((err as Error).message); }
    finally { setImporting(false); }
  };

  const toggleId = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => { if (!previewOrders) return; setSelectedIds(selectedIds.size === previewOrders.length ? new Set() : new Set(previewOrders.map(o => o.raw_email_id))); };
  const handleSaveEdit = async () => {
    if (!editingId) return;
    const updated = await apiFetch<Order>(`/orders/${editingId}`, { method: 'PATCH', body: JSON.stringify(editForm) });
    setLocalOrders(o => o.map(x => x.id === editingId ? updated : x));
    setEditingId(null);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('刪除此訂單？')) return;
    await apiFetch(`/orders/${id}`, { method: 'DELETE' });
    setLocalOrders(o => o.filter(x => x.id !== id));
  };
  const handleConfirm = async (id: string) => {
    await apiFetch(`/orders/${id}/confirm`, { method: 'PATCH' });
    setLocalOrders(o => o.map(x => x.id === id ? { ...x, flaggedForReview: false } : x));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '24px 26px', width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Add orders</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Method 1: Manual */}
          <div style={{ border: `1px solid ${P_BORDER}`, borderRadius: 12, padding: '16px 18px', background: '#FAFBFF' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.04em' }}>手動新增</p>
            <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>供應商</label>
                  <input required placeholder="航空公司、飯店名稱…" value={manualForm.vendor} onChange={e => setManualForm(f => ({ ...f, vendor: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>類型</label>
                  <select value={manualForm.type} onChange={e => setManualForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                    <option value="flight">機票</option><option value="accommodation">住宿</option><option value="activity">活動</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>訂單編號（選填）</label>
                <input placeholder="Booking ref" value={manualForm.booking_ref} onChange={e => setManualForm(f => ({ ...f, booking_ref: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>開始時間</label>
                  <input required type="datetime-local" value={manualForm.start_datetime} onChange={e => setManualForm(f => ({ ...f, start_datetime: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>結束時間</label>
                  <input required type="datetime-local" value={manualForm.end_datetime} onChange={e => setManualForm(f => ({ ...f, end_datetime: e.target.value }))} style={inp} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>價格</label>
                  <input required type="number" min="0" step="0.01" placeholder="0" value={manualForm.price} onChange={e => setManualForm(f => ({ ...f, price: e.target.value }))} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>幣別</label>
                  <input placeholder="USD" value={manualForm.currency} onChange={e => setManualForm(f => ({ ...f, currency: e.target.value }))} style={inp} />
                </div>
              </div>
              <button type="submit" disabled={manualSaving} style={{ padding: '9px 0', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: manualSaving ? 0.6 : 1 }}>
                {manualSaving ? '新增中…' : '新增'}
              </button>
            </form>
          </div>

          {/* Method 2: Email import */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showScanForm ? 14 : 0 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>從信箱匯入</p>
              {!showScanForm && (
                <button onClick={() => setShowScanForm(true)} style={{ padding: '7px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  import from mail
                </button>
              )}
            </div>

            {showScanForm && (
              <>
                {!gmailConnected && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
                    尚未連結 Gmail — <a href="/settings/email" style={{ color: P }}>前往設定</a>
                  </div>
                )}
                <form onSubmit={handleScan}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>開始日期
                      <input type="date" value={scanFrom} onChange={e => setScanFrom(e.target.value)} required style={{ display: 'block', marginTop: 6, ...inp }} />
                    </label>
                    <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>結束日期
                      <input type="date" value={scanTo} onChange={e => setScanTo(e.target.value)} required style={{ display: 'block', marginTop: 6, ...inp }} />
                    </label>
                  </div>
                  {scanError && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#DC2626' }}>{scanError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={!gmailConnected || scanning} style={{ padding: '9px 22px', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (!gmailConnected || scanning) ? 0.6 : 1 }}>
                      {scanning ? '掃描中…' : '開始掃描'}
                    </button>
                    <button type="button" onClick={() => { setShowScanForm(false); setPreviewOrders(null); setSelectedIds(new Set()); setScanError(null); }} style={{ padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff', color: '#374151' }}>
                      取消
                    </button>
                  </div>
                </form>

                {previewOrders !== null && (
                  <div style={{ marginTop: 14 }}>
                    {previewOrders.length === 0 ? (
                      <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>未找到符合條件的訂單確認信</p>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>找到 {previewOrders.length} 筆訂單，請勾選要加入的項目：</span>
                          <button onClick={toggleAll} style={{ fontSize: 12, padding: '3px 12px', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', background: '#fff' }}>
                            {selectedIds.size === previewOrders.length ? '取消全選' : '全選'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                          {previewOrders.map(order => (
                            <label key={order.raw_email_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 9, cursor: 'pointer', background: selectedIds.has(order.raw_email_id) ? P_LIGHT : '#fff' }}>
                              <input type="checkbox" checked={selectedIds.has(order.raw_email_id)} onChange={() => toggleId(order.raw_email_id)} style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: P }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, fontSize: 14 }}>{order.vendor || '(未知供應商)'}</span>
                                  <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '1px 7px', borderRadius: 10 }}>{TYPE_LABEL[order.type] ?? order.type}</span>
                                  {order.flagged_for_review && <span style={{ fontSize: 11, background: '#FFFBEB', color: '#92400E', padding: '1px 7px', borderRadius: 10 }}>待確認</span>}
                                </div>
                                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{order.start_datetime.slice(0, 10)}{order.booking_ref ? ` · ${order.booking_ref}` : ''}</span>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{order.price.toLocaleString()} {order.currency}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleImport} disabled={selectedIds.size === 0 || importing} style={{ padding: '9px 22px', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (selectedIds.size === 0 || importing) ? 0.5 : 1 }}>
                            {importing ? '加入中…' : `確認匯入 (${selectedIds.size} 筆)`}
                          </button>
                          <button onClick={() => { setPreviewOrders(null); setSelectedIds(new Set()); }} style={{ padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff' }}>取消</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Existing orders */}
          {localOrders.length > 0 && (
            <div>
              <p style={{ margin: '4px 0 10px', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {localOrders.length} 筆訂單
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {localOrders.map(order => (
                  <div key={order.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '13px 15px', background: '#fff' }}>
                    {editingId === order.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input placeholder="Vendor" defaultValue={order.vendor} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} style={{ ...inp, width: '100%' }} />
                        <input placeholder="Booking ref" defaultValue={order.bookingRef} onChange={e => setEditForm(f => ({ ...f, bookingRef: e.target.value }))} style={{ ...inp, width: '100%' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleSaveEdit} style={{ padding: '6px 14px', background: P, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>Save</button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', fontSize: 13, background: '#fff' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.95rem' }}>{TYPE_ICON[order.type] ?? '📄'}</span>
                            <strong style={{ fontSize: 14 }}>{order.vendor}</strong>
                            {order.flaggedForReview && (
                              <span onClick={() => handleConfirm(order.id)} style={{ background: '#FFFBEB', color: '#92400E', padding: '1px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>待確認</span>
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0', color: '#9CA3AF', fontSize: 12 }}>{order.startDatetime?.slice(0, 10)} – {order.endDatetime?.slice(0, 10)}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{order.price.toLocaleString()} {order.currency}</span>
                          <button onClick={() => { setEditingId(order.id); setEditForm({}); }} style={{ padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff' }}>Edit</button>
                          <button onClick={() => handleDelete(order.id)} style={{ padding: '4px 10px', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff' }}>刪除</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── OrdersPage ──────────────────────────────────────────────────────────────────

export default function OrdersPage({ params }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const closeModal = () => { setShowAddModal(false); loadOrders(); };

  return (
    <TripPageShell tripId={params.id}>
      {showAddModal && (
        <AddOrdersModal tripId={params.id} gmailConnected={gmailConnected} initialOrders={orders} onClose={closeModal} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => { setFilter(t.value); loadOrders(t.value); }}
              style={{
                padding: '6px 16px', borderRadius: '9999px',
                border: filter === t.value ? 'none' : '1px solid #E5E7EB',
                background: filter === t.value ? P : '#fff',
                color: filter === t.value ? '#fff' : '#374151',
                cursor: 'pointer', fontSize: 13, fontWeight: filter === t.value ? 600 : 400,
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddModal(true)} style={{
          padding: '8px 18px', background: P, color: '#fff',
          border: 'none', borderRadius: '9999px', cursor: 'pointer',
          fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
        }}>
          + 加入訂單
        </button>
      </div>

      {/* Order list */}
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>No orders yet. Add your first booking!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: '1rem' }}>{TYPE_ICON[order.type] ?? '📄'}</span>
                    <strong style={{ fontSize: '0.95rem', color: '#111827' }}>{order.vendor}</strong>
                    <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 10 }}>{TYPE_LABEL[order.type] ?? order.type}</span>
                    {order.flaggedForReview && (
                      <span style={{ fontSize: 11, background: '#FFFBEB', color: '#92400E', padding: '2px 8px', borderRadius: 10 }}>待確認</span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.8rem' }}>
                    {order.bookingRef ? `${order.bookingRef} · ` : ''}{order.startDatetime?.slice(0, 10)} – {order.endDatetime?.slice(0, 10)}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#CBD5E1' }}>Added by {order.createdByName}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{order.price.toLocaleString()} {order.currency}</span>
                  <button onClick={() => setShowAddModal(true)} style={{ padding: '4px 12px', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#374151' }}>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </TripPageShell>
  );
}

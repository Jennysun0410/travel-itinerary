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
const STEPS = ['選擇日期', '掃描信箱', '確認訂單', '加入行程', '加入成功'];

// ── Illustrations ─────────────────────────────────────────────────────────────

function IllustCalendar() {
  return (
    <svg viewBox="0 0 160 112" width="160" height="112" style={{ display: 'block', margin: '0 auto 20px' }}>
      <rect x="12" y="22" width="136" height="84" rx="10" fill="white" stroke="#BFDBFE" strokeWidth="2"/>
      <rect x="12" y="22" width="136" height="28" rx="10" fill="#3B82F6"/>
      <rect x="12" y="38" width="136" height="12" fill="#3B82F6"/>
      <rect x="46" y="13" width="9" height="20" rx="4.5" fill="#93C5FD"/>
      <rect x="105" y="13" width="9" height="20" rx="4.5" fill="#93C5FD"/>
      <text x="80" y="39" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="sans-serif">2026年6月</text>
      {[28,45,62,79,96,113,130].map(x => <circle key={x} cx={x} cy={63} r="3" fill="#E5E7EB"/>)}
      <circle cx="28" cy="84" r="3" fill="#E5E7EB"/>
      <rect x="45" y="78" width="85" height="12" rx="6" fill="#DBEAFE"/>
      {[62,79,96].map(x => <circle key={x} cx={x} cy={84} r="3.5" fill="#BFDBFE"/>)}
      <circle cx="45" cy="84" r="12" fill="#3B82F6"/>
      <text x="45" y="88" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="sans-serif">8</text>
      <circle cx="130" cy="84" r="12" fill="#3B82F6"/>
      <text x="130" y="88" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="sans-serif">14</text>
      {[28,45,62].map(x => <circle key={x} cx={x} cy={105} r="3" fill="#E5E7EB"/>)}
    </svg>
  );
}

function IllustEmail() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" style={{ display: 'block', margin: '0 auto 20px' }}>
      <rect x="14" y="16" width="86" height="66" rx="8" fill="white" stroke="#BFDBFE" strokeWidth="2"/>
      <path d="M14 16 L57 48 L100 16" fill="none" stroke="#BFDBFE" strokeWidth="2"/>
      <line x1="28" y1="62" x2="86" y2="62" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round"/>
      <line x1="28" y1="72" x2="72" y2="72" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="33" x2="98" y2="33" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 3"/>
      <circle cx="126" cy="56" r="27" fill="white" stroke="#DBEAFE" strokeWidth="1.5"/>
      <circle cx="124" cy="54" r="18" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2.5"/>
      <line x1="137" y1="67" x2="149" y2="79" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round"/>
      <text x="124" y="59" textAnchor="middle" fill="#3B82F6" fontSize="14" fontWeight="700" fontFamily="sans-serif">@</text>
    </svg>
  );
}

function IllustAdding() {
  return (
    <svg viewBox="0 0 180 112" width="180" height="112" style={{ display: 'block', margin: '0 auto 20px' }}>
      <rect x="8" y="36" width="58" height="42" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5 3"/>
      <text x="37" y="54" textAnchor="middle" fill="#3B82F6" fontSize="10" fontWeight="700" fontFamily="sans-serif">新訂單</text>
      <text x="37" y="70" textAnchor="middle" fill="#93C5FD" fontSize="14" fontFamily="sans-serif">✈</text>
      <line x1="70" y1="57" x2="96" y2="57" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M91 50 L99 57 L91 64" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
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
    <svg viewBox="0 0 180 142" width="180" height="142" style={{ display: 'block', margin: '0 auto 12px' }}>
      {star(22, 30, 7, '#FCD34D')}
      {star(156, 24, 5, '#FCD34D')}
      {star(163, 74, 4, '#A7F3D0')}
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

// ── Step Bar ──────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                background: done || active ? '#0070f3' : '#e5e7eb',
                color: done || active ? '#fff' : '#9ca3af',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? '#0070f3' : done ? '#6b7280' : '#9ca3af', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#0070f3' : '#e5e7eb', margin: '0 4px', marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  tripId: string;
  gmailConnected: boolean;
  isDemo?: boolean;
  demoOrders?: ParsedOrder[];
  onClose: () => void;
  onImported: () => void;
}

const btnPrimary: React.CSSProperties = { flex: 1, padding: '10px 0', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff', color: '#374151' };
const btnBack: React.CSSProperties = { padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 };

function ImportModal({ tripId, gmailConnected, isDemo = false, demoOrders = [], onClose, onImported }: ModalProps) {
  const [step, setStep] = useState(0);
  const [scanFrom, setScanFrom] = useState('');
  const [scanTo, setScanTo] = useState('');
  const [previewOrders, setPreviewOrders] = useState<ParsedOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(1);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1400));
      setPreviewOrders(demoOrders);
      setSelectedIds(new Set(demoOrders.map(o => o.raw_email_id)));
      setStep(2);
      return;
    }
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
    const selected = previewOrders.filter(o => selectedIds.has(o.raw_email_id));
    setImporting(true);
    setError(null);
    setStep(3);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1400));
      setImportedCount(selected.length);
      setStep(4);
      setImporting(false);
      return;
    }
    try {
      const result = await apiFetch<{ imported: number }>('/email/gmail/import', {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId, orders: selected }),
      });
      setImportedCount(result.imported);
      setStep(4);
      onImported();
    } catch (err) {
      setError((err as Error).message);
      setStep(2);
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
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '92%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>從信箱匯入訂單{isDemo ? '（示範）' : ''}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>

        <StepBar current={step} />

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Step 0: 選擇日期 */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <IllustCalendar />
              <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!gmailConnected && !isDemo && (
                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: 12, fontSize: 13 }}>
                    尚未連結 Gmail —{' '}
                    <a href="/settings/email" style={{ color: '#0070f3' }}>前往設定</a>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                    開始日期
                    <input type="date" value={isDemo ? '2026-06-01' : scanFrom}
                      onChange={e => !isDemo && setScanFrom(e.target.value)}
                      required={!isDemo}
                      style={{ display: 'block', marginTop: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontSize: 14, background: isDemo ? '#f9fafb' : undefined }} />
                  </label>
                  <label style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                    結束日期
                    <input type="date" value={isDemo ? '2026-06-30' : scanTo}
                      onChange={e => !isDemo && setScanTo(e.target.value)}
                      required={!isDemo}
                      style={{ display: 'block', marginTop: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontSize: 14, background: isDemo ? '#f9fafb' : undefined }} />
                  </label>
                </div>
                {isDemo && <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>示範模式：日期已預填，點擊下方按鈕繼續</p>}
                {error && <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={onClose} style={btnSecondary}>取消</button>
                  <button type="submit" disabled={!isDemo && !gmailConnected}
                    style={{ ...btnPrimary, opacity: (!isDemo && !gmailConnected) ? 0.5 : 1 }}>
                    開始掃描 →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 1: 掃描信箱 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
              <IllustEmail />
              <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#0070f3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>正在掃描信箱中的訂單確認信…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 2: 確認訂單 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {previewOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
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
                <button onClick={() => setStep(0)} style={btnBack}>← 返回</button>
                {previewOrders.length > 0 ? (
                  <button onClick={handleImport} disabled={selectedIds.size === 0}
                    style={{ ...btnPrimary, opacity: selectedIds.size === 0 ? 0.5 : 1 }}>
                    加入行程 ({selectedIds.size} 筆)
                  </button>
                ) : (
                  <button onClick={onClose} style={btnPrimary}>關閉</button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 加入行程（loading） */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
              <IllustAdding />
              <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>正在將訂單加入行程中…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 4: 加入成功 */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <IllustSuccess count={importedCount} />
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#065f46' }}>加入成功！</p>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
                已新增 {importedCount} 筆訂單<br/>
                <span style={{ color: '#374151', fontWeight: 500 }}>訂單會出現在你的行程中</span>
              </p>
              <button onClick={onClose}
                style={{ marginTop: 12, padding: '11px 44px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                完成
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage({ params }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [demoOrders, setDemoOrders] = useState<ParsedOrder[]>([]);

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
    setIsDemo(true);
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

  const closeModal = () => { setShowImportModal(false); setIsDemo(false); setDemoOrders([]); };

  return (
    <main style={{ padding: 24 }}>
      {showImportModal && (
        <ImportModal
          tripId={params.id}
          gmailConnected={gmailConnected}
          isDemo={isDemo}
          demoOrders={demoOrders}
          onClose={closeModal}
          onImported={loadOrders}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Orders</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openDemo} style={{ padding: '8px 14px', background: '#fff', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>示範預覽</button>
          <button onClick={() => setShowImportModal(true)} style={{ padding: '8px 14px', border: '1px solid #0070f3', color: '#0070f3', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>從信箱匯入</button>
          <button onClick={() => setShowManual(v => !v)} style={{ padding: '8px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>+ 手動新增</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => { setFilter(t.value); loadOrders(t.value); }}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: filter === t.value ? '#0070f3' : '#fff', color: filter === t.value ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

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

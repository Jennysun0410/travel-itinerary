'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api';
import { TripPageShell } from '../../../../components/TripPageShell';
import type { TripMember } from '@travel/shared';

interface Props { params: { id: string } }

export default function MembersPage({ params }: Props) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    apiFetch<TripMember[]>(`/trips/${params.id}/members`).then(setMembers).catch(console.error);
  }, [params.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await apiFetch(`/trips/${params.id}/invitations`, { method: 'POST', body: JSON.stringify({ email }) });
      setMessage({ text: `Invitation sent to ${email}`, ok: true });
      setEmail('');
    } catch (err) {
      setMessage({ text: (err as Error).message, ok: false });
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await apiFetch(`/trips/${params.id}/members/${userId}`, { method: 'DELETE' });
      setMembers(m => m.filter(x => x.userId !== userId));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const inp: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
    fontSize: '0.875rem', fontFamily: 'system-ui, sans-serif', outline: 'none',
  };

  return (
    <TripPageShell tripId={params.id}>
      <div style={{ maxWidth: 520 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>Members</h2>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: 24 }}>
          {members.length === 0 && (
            <p style={{ padding: '16px 20px', margin: 0, color: '#9CA3AF', fontSize: '0.875rem' }}>No members yet.</p>
          )}
          {members.map((m, i) => (
            <div key={m.userId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px',
              borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{m.displayName}</div>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 1 }}>{m.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: '0.72rem', padding: '2px 10px', borderRadius: '9999px',
                  background: m.role === 'owner' ? '#EFF6FF' : '#F3F4F6',
                  color: m.role === 'owner' ? '#2563EB' : '#6B7280',
                  fontWeight: 500,
                }}>
                  {m.role}
                </span>
                {m.role === 'collaborator' && (
                  <button
                    onClick={() => handleRemove(m.userId)}
                    style={{ color: '#DC2626', background: 'none', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', padding: '3px 10px' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>Invite someone</h3>
          {message && (
            <div style={{
              marginBottom: 12, padding: '9px 12px', borderRadius: 8, fontSize: '0.825rem',
              background: message.ok ? '#ECFDF5' : '#FEF2F2',
              color: message.ok ? '#065F46' : '#DC2626',
              border: `1px solid ${message.ok ? '#A7F3D0' : '#FECACA'}`,
            }}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ ...inp, flex: 1 }}
            />
            <button
              type="submit"
              style={{
                padding: '9px 20px', background: '#2563EB', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 600, flexShrink: 0,
              }}
            >
              Invite
            </button>
          </form>
        </div>
      </div>
    </TripPageShell>
  );
}

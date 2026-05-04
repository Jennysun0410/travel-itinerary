'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api';
import type { TripMember } from '@travel/shared';

interface Props { params: { id: string } }

export default function MembersPage({ params }: Props) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch<TripMember[]>(`/trips/${params.id}/members`).then(setMembers).catch(console.error);
  }, [params.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await apiFetch(`/trips/${params.id}/invitations`, { method: 'POST', body: JSON.stringify({ email }) });
      setMessage(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err) {
      setMessage((err as Error).message);
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

  return (
    <main style={{ padding: 24, maxWidth: 600 }}>
      <h2>Members</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {members.map(m => (
          <li key={m.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>{m.displayName} ({m.email}) — <em>{m.role}</em></span>
            {m.role === 'collaborator' && (
              <button onClick={() => handleRemove(m.userId)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            )}
          </li>
        ))}
      </ul>
      <h3>Invite someone</h3>
      {message && <p>{message}</p>}
      <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Invite</button>
      </form>
    </main>
  );
}

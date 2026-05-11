'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import type { EmailConnection } from '@travel/shared';

async function redirectToGmailConnect() {
  const { url } = await apiFetch<{ url: string }>('/email/gmail/connect-url');
  window.location.href = url;
}

export default function EmailSettingsPage() {
  const [connections, setConnections] = useState<EmailConnection[]>([]);

  useEffect(() => {
    apiFetch<EmailConnection[]>('/email/connections').then(setConnections).catch(console.error);
  }, []);

  const handleDisconnect = async (id: string) => {
    await apiFetch(`/email/connections/${id}`, { method: 'DELETE' });
    setConnections(c => c.filter(x => x.id !== id));
  };

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h2>Email Connections</h2>
      <p>Connect your email to automatically import booking confirmations.</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {connections.map(c => (
          <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>{c.provider === 'gmail' ? '📧 Gmail' : '📨 Outlook'} — {c.email}</span>
            <button onClick={() => handleDisconnect(c.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Disconnect</button>
          </li>
        ))}
        {connections.length === 0 && <li style={{ color: '#999' }}>No email accounts connected</li>}
      </ul>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button onClick={redirectToGmailConnect} style={{ padding: '8px 16px', background: '#EA4335', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 }}>Connect Gmail</button>
      </div>
    </main>
  );
}

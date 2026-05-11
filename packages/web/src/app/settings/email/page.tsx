'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import type { EmailConnection } from '@travel/shared';

async function redirectToGmailConnect() {
  const { url } = await apiFetch<{ url: string }>('/email/gmail/connect-url');
  window.location.href = url;
}

function EmailSettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const connected = params.get('connected');
  const [connections, setConnections] = useState<EmailConnection[]>([]);

  useEffect(() => {
    apiFetch<EmailConnection[]>('/email/connections').then(setConnections).catch(console.error);
  }, []);

  useEffect(() => {
    if (connected === 'gmail') {
      const returnUrl = sessionStorage.getItem('gmailReturnUrl') ?? '/trips';
      sessionStorage.removeItem('gmailReturnUrl');
      const timer = setTimeout(() => router.replace(returnUrl), 2000);
      return () => clearTimeout(timer);
    }
  }, [connected, router]);

  const handleDisconnect = async (id: string) => {
    await apiFetch(`/email/connections/${id}`, { method: 'DELETE' });
    setConnections(c => c.filter(x => x.id !== id));
  };

  if (connected === 'gmail') {
    return (
      <main style={{ padding: 24, maxWidth: 480 }}>
        <h2 style={{ color: '#0a7c3e' }}>✓ Gmail 連結成功</h2>
        <p style={{ color: '#666' }}>正在返回訂單頁面…</p>
      </main>
    );
  }

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
      {!connections.some(c => c.provider === 'gmail') && (
        <div style={{ marginTop: 16 }}>
          <button onClick={redirectToGmailConnect} style={{ padding: '8px 16px', background: '#EA4335', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 }}>Connect Gmail</button>
        </div>
      )}
    </main>
  );
}

export default function EmailSettingsPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <EmailSettingsContent />
    </Suspense>
  );
}

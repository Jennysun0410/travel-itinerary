'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

async function redirectToGmailConnect() {
  const { url } = await apiFetch<{ url: string }>('/email/gmail/connect-url');
  window.location.href = url;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: username.trim() }),
      });
      setStep(2);
    } catch {
      setError('無法儲存，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>連結 Gmail 以自動匯入訂單確認信</h1>
        <p style={{ color: '#666', marginBottom: 32, textAlign: 'center', maxWidth: 320 }}>連結後，系統將自動掃描訂單確認信並加入行程</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          <button
            onClick={redirectToGmailConnect}
            style={{ display: 'block', padding: '10px 14px', borderRadius: 8, background: '#EA4335', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer', width: '100%' }}
          >
            連結 Gmail
          </button>
          <button
            onClick={() => router.replace('/trips')}
            style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f5f5', color: '#555', border: '1px solid #ddd', fontSize: 16, cursor: 'pointer' }}
          >
            略過
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>歡迎！設定你的暱稱</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>這個名稱會顯示給旅行夥伴看</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <input
          type="text"
          placeholder="輸入暱稱"
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={30}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
          autoFocus
        />
        {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !username.trim()}
          style={{ padding: '10px 14px', borderRadius: 8, background: '#0070f3', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer', opacity: loading || !username.trim() ? 0.6 : 1 }}
        >
          {loading ? '儲存中…' : '開始使用'}
        </button>
      </form>
    </main>
  );
}

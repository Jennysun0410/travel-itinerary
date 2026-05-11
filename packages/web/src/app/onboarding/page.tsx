'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      router.replace('/trips');
    } catch {
      setError('無法儲存，請再試一次');
      setLoading(false);
    }
  };

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

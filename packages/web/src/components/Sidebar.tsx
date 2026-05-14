'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { useI18n, type Locale } from '../lib/i18n';
import type { EmailConnection } from '@travel/shared';

const S = {
  bg: '#f4f4f5',
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
  subtle: '#a1a1aa',
} as const;

interface UserMe { id: string; username: string; email: string; display_name: string }

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  const [displayName, setDisplayName] = useState('');
  const [connectedEmail, setConnectedEmail] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<UserMe>('/users/me').then(u => {
      if (u.display_name) setDisplayName(u.display_name);
    }).catch(() => {});
    apiFetch<EmailConnection[]>('/email/connections').then(conns => {
      const gmail = conns.find(c => c.provider === 'gmail');
      if (gmail) setConnectedEmail(gmail.email);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify({ username: displayName.trim() || 'User' }) });
      setToast(t('savedHint'));
      setTimeout(() => setToast(''), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const greeting = displayName.trim()
    ? t('greet').replace('{name}', displayName.trim())
    : '';

  const navLinks = [
    { href: '/trips', label: t('navTrips') },
    { href: '/inbox', label: t('navInbox') },
  ];

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid ${S.border}`,
    borderRadius: 10, font: 'inherit', fontSize: 14,
    background: S.surface, color: S.text, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      width: 268,
      height: '100%',
      background: S.surface,
      borderRight: `1px solid ${S.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      boxSizing: 'border-box',
      overflowY: 'auto',
    }}>
        {/* Brand */}
        <Link href="/trips" style={{
          fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
          color: S.text, textDecoration: 'none',
          padding: '6px 8px 4px', display: 'block',
        }}>
          {t('brand')}
        </Link>

        {/* Greeting */}
        {greeting && (
          <p style={{ margin: '8px 8px 20px', fontSize: 13, color: S.muted, lineHeight: 1.45 }}>
            <strong style={{ color: S.text, fontWeight: 600 }}>{greeting}</strong>
          </p>
        )}
        {!greeting && <div style={{ marginBottom: 20 }} />}

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navLinks.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link key={href} href={href} onClick={onClose} style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: S.text,
                textDecoration: 'none',
                background: active ? S.bg : S.surface,
                border: `1px solid ${active ? S.border : 'transparent'}`,
              }}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1, minHeight: 20 }} />

        {/* Settings panel */}
        <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 16 }}>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 13, fontWeight: 600, color: S.text,
              padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span>{t('settings')}</span>
            <span style={{
              display: 'inline-block', width: 7, height: 7,
              borderRight: `2px solid ${S.subtle}`, borderBottom: `2px solid ${S.subtle}`,
              transform: settingsOpen ? 'rotate(-135deg)' : 'rotate(45deg)',
              marginBottom: settingsOpen ? -3 : 0,
              transition: 'transform 0.2s ease',
            }} />
          </button>

          {settingsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              {/* Display name */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: S.subtle, marginBottom: 6 }}>
                  {t('labelDisplayName')}
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder={t('phDisplayName')}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={inp}
                />
              </div>

              {/* Connected email */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: S.subtle, marginBottom: 6 }}>
                  {t('labelConnectedEmail')}
                </label>
                {connectedEmail ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 13, color: S.muted }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{connectedEmail}</span>
                    <Link href="/settings/email" style={{ fontSize: 12, color: S.muted, textDecoration: 'none', flexShrink: 0, marginLeft: 8 }}>{t('manageEmail')}</Link>
                  </div>
                ) : (
                  <Link href="/settings/email" style={{ display: 'block', padding: '9px 12px', border: `1px dashed ${S.border}`, borderRadius: 10, fontSize: 13, color: S.muted, textDecoration: 'none', textAlign: 'center' }}>
                    {t('noEmailConnected')} →
                  </Link>
                )}
              </div>

              {/* Language */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: S.subtle, marginBottom: 6 }}>
                  {t('labelLanguage')}
                </label>
                <select
                  value={locale}
                  onChange={e => setLocale(e.target.value as Locale)}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  <option value="zh-Hant">{t('langZh')}</option>
                  <option value="en">{t('langEn')}</option>
                </select>
              </div>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: S.text, color: S.surface,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
                }}
              >
                {t('btnSave')}
              </button>

              {toast && <p style={{ margin: 0, fontSize: 12, color: S.muted }}>{toast}</p>}
            </div>
          )}
        </div>
      </div>
  );
}

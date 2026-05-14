'use client';

import React from 'react';
import { AppLayout, useSidebar } from './AppLayout';
import { useI18n } from '../lib/i18n';

const S = {
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
} as const;

interface NavbarProps {
  children: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const { t } = useI18n();
  const { openSidebar } = useSidebar();

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '0 20px 48px', flex: 1 }}>
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.22)',
          marginBottom: 24,
        }}>
          <button
            type="button"
            onClick={openSidebar}
            aria-label={t('openMenu')}
            style={{
              width: 36, height: 36, borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.18)',
              color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            {t('brand')}
          </span>
        </header>
        {children}
      </div>
    </AppLayout>
  );
}

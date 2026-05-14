'use client';

import { getApiUrl } from '../lib/api';

const BLUE_GRADIENT = 'linear-gradient(160deg, #52AAEC 0%, #2D8EE3 55%, #1A72D4 100%)';

const S = {
  surface: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
  bg: '#f4f4f5',
} as const;

function PlaneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 18h4M12 3v2M6.5 8.5L4 11l8 1 8-1-2.5-2.5M8.5 14L7 21l5-2 5 2-1.5-7"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MockCard({
  upcoming = false,
  name,
  place,
  dates,
}: { upcoming?: boolean; name: string; place: string; dates: string }) {
  return (
    <div style={{
      padding: '14px 16px 12px',
      background: S.surface,
      borderRadius: 12,
      border: upcoming ? `1px solid ${S.text}` : `1px solid ${S.border}`,
      boxShadow: upcoming ? `0 0 0 1px ${S.text}` : '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
          <div style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: 10,
            background: S.bg, border: `1px solid ${S.border}`,
            display: 'grid', placeItems: 'center', color: S.text,
          }}>
            <PlaneIcon size={18} />
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: S.text }}>{name}</p>
            <p style={{ margin: 0, fontSize: 12, color: S.muted }}>{place}</p>
          </div>
        </div>
        {upcoming && (
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '4px 9px', borderRadius: 999,
            background: S.text, color: S.surface,
          }}>即將出發</span>
        )}
      </div>
      <div style={{
        marginTop: 10, paddingTop: 10, borderTop: `1px solid ${S.border}`,
        fontSize: 12, fontWeight: 500, color: S.text,
      }}>
        {dates}
      </div>
    </div>
  );
}

export default function SignInPage() {
  const signInUrl = getApiUrl('/auth/google');

  return (
    <>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: BLUE_GRADIENT,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif',
        WebkitFontSmoothing: 'antialiased' as const,
      }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 268, flexShrink: 0,
          background: 'rgba(255,255,255,0.96)',
          borderRight: '1px solid rgba(255,255,255,0.4)',
          display: 'flex', flexDirection: 'column',
          padding: '20px 16px',
        }}>
          {/* Brand */}
          <span style={{
            fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
            color: S.text, padding: '6px 8px 4px', display: 'block',
          }}>
            旅行行程
          </span>

          <div style={{ marginBottom: 20 }} />

          {/* Nav - locked state */}
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            fontSize: 14, fontWeight: 500, color: S.muted,
            background: S.bg, border: `1px solid ${S.border}`,
            opacity: 0.7,
          }}>
            我的行程
          </div>

          <div style={{ flex: 1 }} />

          {/* Sign-in CTA at bottom */}
          <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 20 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: S.muted, lineHeight: 1.5 }}>
              登入後即可查看並管理你的旅程訂單。
            </p>
            <a href={signInUrl} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 10,
              background: S.text, color: S.surface,
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              <GoogleIcon />
              用 Google 帳號登入
            </a>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '8px 24px 8px',
            height: 60, flexShrink: 0,
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.18)',
          }}>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              旅行行程
            </span>
            <a href={signInUrl} style={{
              padding: '8px 18px', borderRadius: 9,
              background: 'rgba(255,255,255,0.18)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.35)',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}>
              登入
            </a>
          </header>

          {/* Content */}
          <div style={{
            maxWidth: 720, width: '100%', margin: '0 auto',
            padding: '28px 24px 60px', flex: 1,
          }}>
            {/* Page title */}
            <h1 style={{
              margin: '0 0 6px', fontSize: 26, fontWeight: 700,
              letterSpacing: '-0.03em', color: '#fff',
            }}>
              我的行程
            </h1>
            <p style={{
              margin: '0 0 28px', fontSize: 14, lineHeight: 1.6,
              color: 'rgba(255,255,255,0.72)',
            }}>
              飛機、住宿、票券等來自不同渠道的訂單，可收斂在同一趟旅程底下檢視與規劃。
            </p>

            {/* Mock trip cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              <MockCard upcoming name="東京自由行" place="東京" dates="5/12 — 5/18 · 2026" />
              <MockCard name="香港週末" place="香港" dates="4/02 — 4/06 · 2026" />
              <MockCard name="首爾五天" place="首爾" dates="3/01 — 3/05 · 2026" />
            </div>

            {/* Sign-in card overlay */}
            <div style={{
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 16, padding: '32px 24px',
              textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                登入後查看你的實際行程
              </p>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>
                建立旅程後，即可把各渠道的訂單或確認信關聯進來，在單一時間軸檢視。
              </p>
              <a href={signInUrl} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 26px', borderRadius: 12,
                background: '#fff', color: S.text,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.16)',
              }}>
                <GoogleIcon dark />
                用 Google 帳號登入
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <style>{`
        @media (max-width: 800px) {
          .landing-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}

function GoogleIcon({ dark = false }: { dark?: boolean }) {
  if (dark) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.9)" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.9)" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="rgba(255,255,255,0.9)" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

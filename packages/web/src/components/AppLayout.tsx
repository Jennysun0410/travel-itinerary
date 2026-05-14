'use client';

import { createContext, useContext, useState } from 'react';
import { Sidebar } from './Sidebar';

interface SidebarCtx { openSidebar: () => void }
const SidebarContext = createContext<SidebarCtx>({ openSidebar: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setIsOpen(true) }}>
      <div className="app-root">
        <aside className={`app-sidebar${isOpen ? ' is-open' : ''}`}>
          <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </aside>
        {isOpen && (
          <div
            className="app-backdrop"
            onClick={() => setIsOpen(false)}
          />
        )}
        <div className="app-main">
          <div className="app-mobile-topbar">
            <button
              className="app-hamburger"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
      <style>{`
        .app-root { display: flex; min-height: 100vh; align-items: stretch; background: linear-gradient(160deg, #52AAEC 0%, #2D8EE3 55%, #1A72D4 100%); }
        .app-sidebar { display: flex; flex-shrink: 0; }
        .app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .app-backdrop { display: none; }
        .app-mobile-topbar { display: none; }
        @media (max-width: 800px) {
          .app-sidebar {
            position: fixed;
            z-index: 40;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-105%);
            transition: transform 0.22s ease;
          }
          .app-sidebar.is-open {
            transform: translateX(0);
            box-shadow: 12px 0 40px rgba(0,0,0,0.12);
          }
          .app-backdrop {
            display: block;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.35);
            z-index: 35;
          }
          .app-mobile-topbar {
            display: flex;
            align-items: center;
            padding: 0 16px;
            height: 52px;
            flex-shrink: 0;
            position: sticky;
            top: 0;
            z-index: 20;
            background: rgba(255,255,255,0.94);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #e4e4e7;
          }
          .app-hamburger {
            width: 38px; height: 38px;
            border-radius: 10px;
            border: 1px solid #e4e4e7;
            background: #fff;
            color: #18181b;
            cursor: pointer;
            display: grid;
            place-items: center;
          }
        }
      `}</style>
    </SidebarContext.Provider>
  );
}

'use client';

import React from 'react';
import { AppLayout } from './AppLayout';

interface NavbarProps {
  children: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  return (
    <AppLayout>
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '16px 20px 48px', flex: 1 }}>
        {children}
      </div>
    </AppLayout>
  );
}

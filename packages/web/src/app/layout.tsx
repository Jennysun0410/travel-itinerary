import type { Metadata } from 'next';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'Travel Itinerary',
  description: 'Organize all your trip bookings in one place',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif', background: '#f4f4f5', color: '#18181b' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

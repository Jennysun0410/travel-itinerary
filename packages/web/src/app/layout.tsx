import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel Itinerary',
  description: 'Organize all your trip bookings in one place',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F7FAFF', color: '#111827' }}>{children}</body>
    </html>
  );
}

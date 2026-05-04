'use client';

import Link from 'next/link';

interface Props { params: { id: string } }

export default function TripPage({ params }: Props) {
  return (
    <main style={{ padding: 24 }}>
      <nav style={{ display: 'flex', gap: 16, borderBottom: '1px solid #ddd', paddingBottom: 12, marginBottom: 16 }}>
        <Link href={`/trips/${params.id}/orders`}>Orders</Link>
        <Link href={`/trips/${params.id}/timeline`}>Timeline</Link>
        <Link href={`/trips/${params.id}/members`}>Members</Link>
      </nav>
      <p>Select a tab above to manage your trip.</p>
    </main>
  );
}

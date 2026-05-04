'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '../../../lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      router.replace('/trips');
    } else {
      router.replace('/?error=auth_failed');
    }
  }, [params, router]);

  return <p>Signing you in…</p>;
}

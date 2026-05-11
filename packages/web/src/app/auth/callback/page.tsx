'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '../../../lib/api';

function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const needsOnboarding = params.get('onboarding') === 'true';
    if (token) {
      setToken(token);
      router.replace(needsOnboarding ? '/onboarding' : '/trips');
    } else {
      router.replace('/?error=auth_failed');
    }
  }, [params, router]);

  return <p>Signing you in…</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <AuthCallback />
    </Suspense>
  );
}

'use client';

import { messages } from '@heliograph/i18n';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth-card';
import { useT } from '@/lib/use-t';

function Body() {
  const t = useT();
  const email = useSearchParams().get('email') ?? '';
  return <p className="m-0 text-ink2">{t(messages.auth.verifyEmailBody, { email })}</p>;
}

export default function VerifyEmailPage() {
  const t = useT();
  return (
    <AuthCard title={t(messages.auth.verifyEmailTitle)}>
      <Suspense>
        <Body />
      </Suspense>
    </AuthCard>
  );
}

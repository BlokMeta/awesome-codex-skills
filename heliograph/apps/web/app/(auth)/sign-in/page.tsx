'use client';

import { messages } from '@heliograph/i18n';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth-card';
import { SignInForm } from '@/components/sign-in-form';
import { useT } from '@/lib/use-t';

export default function SignInPage() {
  const t = useT();
  return (
    <AuthCard title={t(messages.auth.signInTitle)}>
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}

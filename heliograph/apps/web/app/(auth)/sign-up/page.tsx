'use client';

import { messages } from '@heliograph/i18n';
import { AuthCard } from '@/components/auth-card';
import { SignUpForm } from '@/components/sign-up-form';
import { useT } from '@/lib/use-t';

export default function SignUpPage() {
  const t = useT();
  return (
    <AuthCard title={t(messages.auth.signUpTitle)}>
      <SignUpForm />
    </AuthCard>
  );
}

'use client';

import { messages } from '@heliograph/i18n';
import { AuthCard } from '@/components/auth-card';
import { TwoFactorForm } from '@/components/two-factor-form';
import { useT } from '@/lib/use-t';

export default function TwoFactorPage() {
  const t = useT();
  return (
    <AuthCard title={t(messages.auth.twoFactorTitle)}>
      <TwoFactorForm />
    </AuthCard>
  );
}

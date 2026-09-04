'use client';

import { messages } from '@heliograph/i18n';
import { AuthCard } from '@/components/auth-card';
import { ConsentsForm } from '@/components/consents-form';
import { useT } from '@/lib/use-t';

export default function ConsentsPage() {
  const t = useT();
  return (
    <AuthCard title={t(messages.consent.title)}>
      <ConsentsForm />
    </AuthCard>
  );
}

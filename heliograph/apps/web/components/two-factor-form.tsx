'use client';

import { messages } from '@heliograph/i18n';
import { Button, TextInput } from '@heliograph/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/use-t';

export function TwoFactorForm() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const res = await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
    setBusy(false);
    if (res.error) {
      setError(t(messages.auth.twoFactorInvalid));
      return;
    }
    queryClient.clear();
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <p className="m-0 text-ink2">{t(messages.auth.twoFactorHint)}</p>
      <TextInput
        label={t(messages.auth.twoFactorCode)}
        value={code}
        onChangeText={setCode}
        autoComplete="one-time-code"
        maxLength={6}
        required
        error={error}
        testID="code"
      />
      <Button
        type="submit"
        label={t(messages.auth.twoFactorVerify)}
        variant="primary"
        size="lg"
        loading={busy}
        testID="submit"
      />
    </form>
  );
}

'use client';

import { messages } from '@heliograph/i18n';
import { Button, TextInput } from '@heliograph/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/use-t';

export function SignInForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const res = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.status === 401 ? t(messages.auth.invalidCredentials) : t(messages.auth.generic));
      return;
    }
    if ((res.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      router.push('/two-factor');
      return;
    }
    router.push((params.get('next') as '/' | null) ?? '/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <TextInput
        label={t(messages.auth.email)}
        kind="email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        required
        testID="email"
      />
      <TextInput
        label={t(messages.auth.password)}
        kind="password"
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        required
        error={error}
        testID="password"
      />
      <Button type="submit" label={t(messages.auth.signIn)} variant="primary" size="lg" loading={busy} testID="submit" />
      <p className="text-ink2 m-0">
        {t(messages.auth.noAccount)}{' '}
        <Link href="/sign-up" className="text-tide underline">
          {t(messages.auth.signUp)}
        </Link>
      </p>
    </form>
  );
}

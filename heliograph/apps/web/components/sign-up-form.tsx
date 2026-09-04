'use client';

import { messages } from '@heliograph/i18n';
import { Button, TextInput } from '@heliograph/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/use-t';

export function SignUpForm() {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const res = await authClient.signUp.email({
      name,
      email,
      password,
      locale: document.documentElement.lang,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } as Parameters<typeof authClient.signUp.email>[0]);
    setBusy(false);
    if (res.error) {
      setError(res.error.code === 'USER_ALREADY_EXISTS' ? t(messages.auth.emailTaken) : t(messages.auth.generic));
      return;
    }
    router.push('/consents');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <TextInput label={t(messages.auth.name)} value={name} onChangeText={setName} autoComplete="name" required testID="name" />
      <TextInput
        label={t(messages.auth.email)}
        kind="email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        required
        error={error}
        testID="email"
      />
      <TextInput
        label={t(messages.auth.password)}
        hint={t(messages.auth.passwordHint)}
        kind="password"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        required
        testID="password"
      />
      <Button type="submit" label={t(messages.auth.signUp)} variant="primary" size="lg" loading={busy} testID="submit" />
      <p className="text-ink2 m-0">
        {t(messages.auth.haveAccount)}{' '}
        <Link href="/sign-in" className="text-tide underline">
          {t(messages.auth.signIn)}
        </Link>
      </p>
    </form>
  );
}

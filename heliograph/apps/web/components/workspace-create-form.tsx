'use client';

import { messages } from '@heliograph/i18n';
import { Button, TextInput } from '@heliograph/ui';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useT } from '@/lib/use-t';

export const slugify = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

export function WorkspaceCreateForm() {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const effectiveSlug = touched ? slug : slugify(name);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const res = await authClient.organization.create({ name, slug: effectiveSlug });
    if (res.error || !res.data) {
      setBusy(false);
      setError(t(messages.auth.generic));
      return;
    }
    await authClient.organization.setActive({ organizationId: res.data.id });
    setBusy(false);
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <p className="m-0 text-ink2">{t(messages.workspace.createIntro)}</p>
      <TextInput
        label={t(messages.workspace.name)}
        value={name}
        onChangeText={setName}
        required
        testID="name"
      />
      <TextInput
        label={t(messages.workspace.slug)}
        hint={t(messages.workspace.slugHint)}
        value={effectiveSlug}
        onChangeText={(v) => {
          setTouched(true);
          setSlug(slugify(v));
        }}
        required
        error={error}
        testID="slug"
      />
      <Button
        type="submit"
        label={t(messages.workspace.create)}
        variant="primary"
        size="lg"
        loading={busy}
        disabled={!name || !effectiveSlug}
        testID="submit"
      />
    </form>
  );
}

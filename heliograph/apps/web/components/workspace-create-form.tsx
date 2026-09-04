'use client';

import { messages } from '@heliograph/i18n';
import { Button, TextInput } from '@heliograph/ui';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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
    // Drop cached reads so the shell waits for fresh data instead of acting on the old
    // "no workspaces" snapshot (rule 13; invalidate alone still serves stale data first).
    queryClient.removeQueries({ queryKey: ['me'] });
    queryClient.removeQueries({ queryKey: ['entitlements'] });
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

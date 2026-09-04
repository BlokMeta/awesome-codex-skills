'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Button, SelectField, TextInput } from '@heliograph/ui';
import { type FormEvent, useState } from 'react';
import { problemCode } from '@/lib/personas';
import { useT } from '@/lib/use-t';
import { slugify } from '../workspace-create-form';

const NICHES = ['devops', 'ai', 'both', 'personal'] as const;
const LANGUAGES = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

interface IdentityValues {
  name: string;
  slug: string;
  niche: PersonaDto['niche'];
  language: string;
  timezone: string;
}

export function IdentityForm({
  initial,
  submitLabel,
  busy,
  error,
  onSubmit,
}: {
  initial?: Partial<IdentityValues> | undefined;
  submitLabel: string;
  busy: boolean;
  error?: unknown;
  onSubmit: (values: IdentityValues) => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [niche, setNiche] = useState<PersonaDto['niche']>(initial?.niche ?? 'devops');
  const [language, setLanguage] = useState(initial?.language ?? 'tr');
  const [timezone, setTimezone] = useState(
    initial?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const code = problemCode(error);
  const slugError = code === 'persona.slug_taken' ? t(messages.persona.error.slugTaken) : undefined;
  const generic = error && !slugError ? t(messages.auth.generic) : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, slug: effectiveSlug, niche, language, timezone });
  };

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <TextInput
        label={t(messages.persona.field.name)}
        value={name}
        onChangeText={setName}
        required
        testID="p-name"
      />
      <TextInput
        label={t(messages.persona.field.slug)}
        hint={t(messages.workspace.slugHint)}
        value={effectiveSlug}
        onChangeText={(v) => {
          setSlugTouched(true);
          setSlug(slugify(v));
        }}
        required
        error={slugError}
        testID="p-slug"
      />
      <SelectField
        label={t(messages.persona.field.niche)}
        value={niche}
        onChange={setNiche}
        options={NICHES.map((n) => ({ value: n, label: t(messages.persona.niche[n]) }))}
        testID="p-niche"
      />
      <SelectField
        label={t(messages.persona.field.language)}
        value={language}
        onChange={setLanguage}
        options={LANGUAGES}
        testID="p-language"
      />
      <TextInput
        label={t(messages.persona.field.timezone)}
        value={timezone}
        onChangeText={setTimezone}
        required
        testID="p-timezone"
        error={generic}
      />
      <Button
        type="submit"
        label={submitLabel}
        variant="primary"
        size="lg"
        loading={busy}
        disabled={!name || !effectiveSlug || !timezone}
        testID="p-submit"
      />
    </form>
  );
}

'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Button, SelectField, Switch } from '@heliograph/ui';
import { type FormEvent, useId, useState } from 'react';
import { useT } from '@/lib/use-t';

type Kit = PersonaDto['visualKit'];

function ColorField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  const id = useId();
  return (
    <div className="hg-field">
      <label className="hg-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          data-testid={testID}
          className="h-9 w-12 border border-line rounded-[var(--hg-radius-sm)] bg-surface p-0.5"
        />
        <span className="font-mono text-[length:var(--hg-font-size-sm)]">{value}</span>
      </div>
    </div>
  );
}

export function VisualStep({
  persona,
  busy,
  onSave,
}: {
  persona: PersonaDto;
  busy: boolean;
  onSave: (patch: { visualKit: Kit }) => void;
}) {
  const t = useT();
  const [kit, setKit] = useState<Kit>(persona.visualKit);
  const palette = (k: keyof Kit['palette'], v: string) =>
    setKit((x) => ({ ...x, palette: { ...x.palette, [k]: v } }));
  const initials = persona.name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('tr');
  const fontVar = {
    display: 'var(--hg-font-display)',
    body: 'var(--hg-font-body)',
    mono: 'var(--hg-font-mono)',
  }[kit.fontFamily];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ visualKit: kit });
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <ColorField
          label={t(messages.persona.visual.primary)}
          value={kit.palette.primary}
          onChange={(v) => palette('primary', v)}
          testID="vk-primary"
        />
        <ColorField
          label={t(messages.persona.visual.accent)}
          value={kit.palette.accent}
          onChange={(v) => palette('accent', v)}
        />
        <ColorField
          label={t(messages.persona.visual.ground)}
          value={kit.palette.ground}
          onChange={(v) => palette('ground', v)}
        />
      </div>
      <SelectField
        label={t(messages.persona.visual.font)}
        value={kit.fontFamily}
        onChange={(fontFamily) => setKit((x) => ({ ...x, fontFamily }))}
        options={[
          { value: 'display', label: t(messages.persona.visual.fontDisplay) },
          { value: 'body', label: t(messages.persona.visual.fontBody) },
          { value: 'mono', label: t(messages.persona.visual.fontMono) },
        ]}
      />
      <Switch
        label={t(messages.persona.visual.watermark)}
        checked={kit.watermark}
        onChange={(watermark) => setKit((x) => ({ ...x, watermark }))}
      />
      <section
        aria-label={t(messages.persona.visual.preview)}
        data-testid="vk-preview"
        className="rounded-[var(--hg-radius-md)] border border-line p-6 grid gap-3"
        style={{ background: kit.palette.ground, color: kit.palette.primary, fontFamily: fontVar }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid place-items-center h-10 w-10 rounded-full text-sm font-semibold"
            style={{ background: kit.palette.primary, color: kit.palette.ground }}
          >
            {initials}
          </span>
          <span className="font-semibold">{persona.name}</span>
        </div>
        <p
          className="m-0"
          style={{ borderInlineStart: `3px solid ${kit.palette.accent}`, paddingInlineStart: 12 }}
        >
          {persona.voiceBible.samplePosts[0] ?? persona.voiceBible.summary ?? persona.name}
        </p>
        {kit.watermark ? (
          <span className="text-[length:var(--hg-font-size-xs)] opacity-70">@{persona.slug}</span>
        ) : null}
      </section>
      <Button
        type="submit"
        label={t(messages.persona.wizard.next)}
        variant="primary"
        size="lg"
        loading={busy}
        testID="step-next"
      />
    </form>
  );
}

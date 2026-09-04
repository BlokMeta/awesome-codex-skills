'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Button, Skeleton } from '@heliograph/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import type { api } from '@/lib/api';
import { problemCode, usePersona, usePersonaMutations } from '@/lib/personas';
import { useT } from '@/lib/use-t';
import { ChannelsStep } from './channels-step';
import { IdentityForm } from './identity-form';
import { PolicyStep } from './policy-step';
import { PreviewStep } from './preview-step';
import { VisualStep } from './visual-step';
import { VoiceStep } from './voice-step';

const STEPS = ['identity', 'voice', 'visual', 'channels', 'policy', 'preview'] as const;
type Step = (typeof STEPS)[number];
type UpdateInput = Parameters<typeof api.persona.update>[0];
const STEP_LABEL = {
  identity: messages.persona.wizard.stepIdentity,
  voice: messages.persona.wizard.stepVoice,
  visual: messages.persona.wizard.stepVisual,
  channels: messages.persona.wizard.stepChannels,
  policy: messages.persona.wizard.stepPolicy,
  preview: messages.persona.wizard.stepPreview,
} as const;

export function PersonaWizard({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('step');
  const step: Step = (STEPS as readonly string[]).includes(raw ?? '') ? (raw as Step) : 'identity';
  const index = STEPS.indexOf(step);
  const persona = usePersona(id);
  const { update, activate, pause, archive } = usePersonaMutations(id);
  const busy = update.isPending || activate.isPending || pause.isPending || archive.isPending;
  const go = (s: Step) => router.push(`/personas/${id}/wizard?step=${s}`);
  const next = () => {
    const n = STEPS[index + 1];
    if (n) go(n);
  };
  const save = (patch: Omit<UpdateInput, 'id' | 'reason'>) =>
    update.mutate({ ...patch, reason: `wizard:${step}` }, { onSuccess: next });

  if (persona.isError) return <p className="text-critical">{t(messages.auth.generic)}</p>;
  if (!persona.data) return <Skeleton height={240} shape="rect" />;
  const p = persona.data;

  return (
    <div className="grid gap-6 max-w-3xl">
      <header className="grid gap-2">
        <p className="m-0 text-ink3 text-[length:var(--hg-font-size-xs)] uppercase tracking-[var(--hg-tracking-label)]">
          {t(messages.persona.wizard.title)} ·{' '}
          {t(messages.persona.wizard.stepOf, { current: index + 1, total: STEPS.length })}
        </p>
        <h1 className="m-0 text-[length:var(--hg-font-size-2xl)] leading-[var(--hg-line-height-2xl)]">
          {p.name}
        </h1>
        <nav aria-label={t(messages.persona.wizard.title)}>
          <ol className="flex flex-wrap gap-2 m-0 p-0 list-none">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  className="hg-button"
                  data-variant={s === step ? 'primary' : 'ghost'}
                  data-size="sm"
                  aria-current={s === step ? 'step' : undefined}
                  onClick={() => go(s)}
                  data-testid={`step-${s}`}
                >
                  {i + 1}. {t(STEP_LABEL[s])}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      {update.isError ? (
        <p
          className="m-0 text-critical text-[length:var(--hg-font-size-sm)]"
          role="alert"
          data-testid="wizard-error"
        >
          {t(messages.auth.generic)} ({problemCode(update.error) ?? (update.error as Error).message}
          )
        </p>
      ) : null}
      {update.isSuccess && !update.isPending ? (
        <p className="m-0 text-good text-[length:var(--hg-font-size-sm)]" aria-live="polite">
          {t(messages.persona.wizard.saved)}
        </p>
      ) : null}
      <section key={step}>
        <WizardStep
          step={step}
          persona={p}
          busy={busy}
          error={update.error}
          onSave={save}
          onNext={next}
          onActivate={() => activate.mutate()}
          onPause={() => pause.mutate()}
          onArchive={() => archive.mutate(undefined, { onSuccess: () => router.push('/personas') })}
        />
      </section>
      {index > 0 ? (
        <div>
          <Button
            label={t(messages.persona.wizard.back)}
            variant="ghost"
            size="sm"
            onPress={() => go(STEPS[index - 1] ?? 'identity')}
          />
        </div>
      ) : null}
    </div>
  );
}

interface WizardStepProps {
  step: Step;
  persona: PersonaDto;
  busy: boolean;
  error: unknown;
  onSave: (patch: Omit<UpdateInput, 'id' | 'reason'>) => void;
  onNext: () => void;
  onActivate: () => void;
  onPause: () => void;
  onArchive: () => void;
}

function WizardStep({
  step,
  persona,
  busy,
  error,
  onSave,
  onNext,
  onActivate,
  onPause,
  onArchive,
}: WizardStepProps) {
  const t = useT();
  switch (step) {
    case 'identity':
      return (
        <IdentityForm
          initial={persona}
          submitLabel={t(messages.persona.wizard.next)}
          busy={busy}
          error={error}
          onSubmit={(v) =>
            onSave({ name: v.name, niche: v.niche, language: v.language, timezone: v.timezone })
          }
        />
      );
    case 'voice':
      return <VoiceStep persona={persona} busy={busy} onSave={onSave} />;
    case 'visual':
      return <VisualStep persona={persona} busy={busy} onSave={onSave} />;
    case 'channels':
      return <ChannelsStep onNext={onNext} />;
    case 'policy':
      return <PolicyStep persona={persona} busy={busy} onSave={onSave} />;
    case 'preview':
      return (
        <PreviewStep
          persona={persona}
          busy={busy}
          onActivate={onActivate}
          onPause={onPause}
          onArchive={onArchive}
        />
      );
    default:
      return null;
  }
}

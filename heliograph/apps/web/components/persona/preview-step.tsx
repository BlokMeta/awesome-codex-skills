'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Button } from '@heliograph/ui';
import { useT } from '@/lib/use-t';
import { StatusBadge } from './status-badge';

const MISSING = {
  'voiceBible.summary': messages.persona.preview.missingSummary,
  'voiceBible.tone': messages.persona.preview.missingTone,
  'topicProfile.include': messages.persona.preview.missingTopics,
} as const;

export function PreviewStep({
  persona,
  busy,
  onActivate,
  onPause,
  onArchive,
}: {
  persona: PersonaDto;
  busy: boolean;
  onActivate: () => void;
  onPause: () => void;
  onArchive: () => void;
}) {
  const t = useT();
  const ready = persona.missingForStart.length === 0;
  const canStart = ready && (persona.status === 'draft' || persona.status === 'paused');
  return (
    <div className="grid gap-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 m-0">
        <dt className="text-ink3">{t(messages.persona.field.name)}</dt>
        <dd className="m-0 flex items-center gap-2">
          {persona.name} <StatusBadge status={persona.status} />
        </dd>
        <dt className="text-ink3">{t(messages.persona.field.niche)}</dt>
        <dd className="m-0">{t(messages.persona.niche[persona.niche])}</dd>
        <dt className="text-ink3">{t(messages.persona.voice.tone)}</dt>
        <dd className="m-0">{persona.voiceBible.tone.join(', ') || '—'}</dd>
        <dt className="text-ink3">{t(messages.persona.voice.topicsInclude)}</dt>
        <dd className="m-0">{persona.topicProfile.include.join(', ') || '—'}</dd>
        <dt className="text-ink3">{t(messages.persona.policy.dailyPosts)}</dt>
        <dd className="m-0 font-mono">
          {persona.postingPolicy.dailyPosts.min}–{persona.postingPolicy.dailyPosts.max} /{' '}
          {persona.postingPolicy.dailyVideos.min}–{persona.postingPolicy.dailyVideos.max}
        </dd>
        <dt className="text-ink3">{t(messages.persona.policy.humanReview)}</dt>
        <dd className="m-0">{persona.qualityPolicy.humanReview}</dd>
      </dl>
      {ready ? (
        <p className="m-0 text-good" data-testid="ready">
          {t(messages.persona.preview.ready)} · {t(messages.persona.preview.warmup, { days: 7 })}
        </p>
      ) : (
        <div className="grid gap-1" data-testid="missing">
          <p className="m-0 text-warn">{t(messages.persona.preview.missing)}</p>
          <ul className="m-0 ps-5">
            {persona.missingForStart.map((f) => (
              <li key={f}>
                {t(MISSING[f as keyof typeof MISSING] ?? messages.persona.error.incomplete)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {persona.status === 'draft' || persona.status === 'paused' ? (
          <Button
            label={t(
              persona.status === 'paused'
                ? messages.persona.wizard.resume
                : messages.persona.wizard.start,
            )}
            variant="primary"
            size="lg"
            flash={ready}
            disabled={!canStart}
            loading={busy}
            onPress={onActivate}
            testID="start"
          />
        ) : null}
        {persona.status === 'warming' || persona.status === 'active' ? (
          <Button
            label={t(messages.persona.wizard.pause)}
            variant="secondary"
            size="lg"
            loading={busy}
            onPress={onPause}
            testID="pause"
          />
        ) : null}
        {persona.status !== 'archived' ? (
          <Button
            label={t(messages.persona.wizard.archive)}
            variant="danger"
            size="lg"
            loading={busy}
            onPress={onArchive}
            testID="archive"
          />
        ) : null}
      </div>
    </div>
  );
}

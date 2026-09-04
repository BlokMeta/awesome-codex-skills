'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Button, IconButton, SelectField, Switch, TextInput } from '@heliograph/ui';
import { type FormEvent, useState } from 'react';
import { useT } from '@/lib/use-t';

type Posting = PersonaDto['postingPolicy'];
type Engagement = PersonaDto['engagementPolicy'];
type Quality = PersonaDto['qualityPolicy'];
interface PolicyPatch {
  postingPolicy: Posting;
  engagementPolicy: Engagement;
  qualityPolicy: Quality;
}

const int = (s: string, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(Number(s) || 0)));
const num = (s: string, min: number, max: number) => Math.max(min, Math.min(max, Number(s) || 0));

export function PolicyStep({
  persona,
  busy,
  onSave,
}: {
  persona: PersonaDto;
  busy: boolean;
  onSave: (patch: PolicyPatch) => void;
}) {
  const t = useT();
  const [posting, setPosting] = useState<Posting>(persona.postingPolicy);
  const [engagement, setEngagement] = useState<Engagement>(persona.engagementPolicy);
  const [quality, setQuality] = useState<Quality>(persona.qualityPolicy);
  const weekdays = t(messages.persona.policy.weekdays).split(',');
  const windowError =
    posting.windows.length === 0 ||
    posting.windows.some((w) => w.from >= w.to || w.days.length === 0);
  const rangeError =
    posting.dailyPosts.min > posting.dailyPosts.max ||
    posting.dailyVideos.min > posting.dailyVideos.max;

  const setWindow = (i: number, patch: Partial<Posting['windows'][number]>) =>
    setPosting((p) => ({
      ...p,
      windows: p.windows.map((w, j) => (j === i ? { ...w, ...patch } : w)),
    }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (windowError || rangeError) return;
    onSave({ postingPolicy: posting, engagementPolicy: engagement, qualityPolicy: quality });
  };

  const range = (label: string, key: 'dailyPosts' | 'dailyVideos') => (
    <fieldset className="grid gap-2 border-0 p-0 m-0">
      <legend className="hg-field__label">{label}</legend>
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label={t(messages.persona.policy.min)}
          kind="number"
          value={String(posting[key].min)}
          onChangeText={(s) =>
            setPosting((p) => ({ ...p, [key]: { ...p[key], min: int(s, 0, 20) } }))
          }
          testID={`${key}-min`}
        />
        <TextInput
          label={t(messages.persona.policy.max)}
          kind="number"
          value={String(posting[key].max)}
          onChangeText={(s) =>
            setPosting((p) => ({ ...p, [key]: { ...p[key], max: int(s, 0, 20) } }))
          }
          testID={`${key}-max`}
          error={rangeError && posting[key].min > posting[key].max ? '⇅' : undefined}
        />
      </div>
    </fieldset>
  );

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {range(t(messages.persona.policy.dailyPosts), 'dailyPosts')}
        {range(t(messages.persona.policy.dailyVideos), 'dailyVideos')}
      </div>

      <fieldset className="grid gap-3 border-0 p-0 m-0">
        <legend className="hg-field__label">{t(messages.persona.policy.windows)}</legend>
        {posting.windows.map((w, i) => (
          <div
            key={`${i}-${w.from}`}
            className="grid gap-3 rounded-[var(--hg-radius-sm)] border border-line p-3"
            data-testid={`window-${i}`}
          >
            <div className="flex flex-wrap gap-2">
              {weekdays.map((d, idx) => {
                const day = idx + 1;
                const on = w.days.includes(day);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    className="hg-button"
                    data-variant={on ? 'primary' : 'secondary'}
                    data-size="sm"
                    onClick={() =>
                      setWindow(i, {
                        days: on ? w.days.filter((x) => x !== day) : [...w.days, day].sort(),
                      })
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <TextInput
                label={t(messages.persona.policy.windowFrom)}
                value={w.from}
                onChangeText={(from) => setWindow(i, { from })}
                kind="text"
                testID={`window-${i}-from`}
                error={w.from >= w.to ? '⇅' : undefined}
              />
              <TextInput
                label={t(messages.persona.policy.windowTo)}
                value={w.to}
                onChangeText={(to) => setWindow(i, { to })}
                kind="text"
                testID={`window-${i}-to`}
              />
              <IconButton
                icon={<span aria-hidden="true">×</span>}
                accessibilityLabel={t(messages.persona.policy.removeWindow)}
                disabled={posting.windows.length === 1}
                onPress={() =>
                  setPosting((p) => ({ ...p, windows: p.windows.filter((_, j) => j !== i) }))
                }
              />
            </div>
          </div>
        ))}
        <div>
          <Button
            label={t(messages.persona.policy.addWindow)}
            variant="ghost"
            size="sm"
            disabled={posting.windows.length >= 3}
            onPress={() =>
              setPosting((p) => ({
                ...p,
                windows: [...p.windows, { days: [1, 2, 3, 4, 5], from: '13:00', to: '15:00' }],
              }))
            }
          />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label={t(messages.persona.policy.jitter)}
          kind="number"
          value={String(posting.jitterMinutes)}
          onChangeText={(s) => setPosting((p) => ({ ...p, jitterMinutes: int(s, 0, 120) }))}
        />
        <TextInput
          label={t(messages.persona.policy.weekendFactor)}
          kind="number"
          value={String(posting.weekendFactor)}
          onChangeText={(s) => setPosting((p) => ({ ...p, weekendFactor: num(s, 0, 1) }))}
        />
      </div>

      <Switch
        label={t(messages.persona.policy.autoReply)}
        description={t(messages.persona.policy.autoReplyHint)}
        checked={engagement.autoReply}
        onChange={(autoReply) => setEngagement((e) => ({ ...e, autoReply }))}
        testID="auto-reply"
      />
      <TextInput
        label={t(messages.persona.policy.replyRatio)}
        kind="number"
        value={String(engagement.replyRatio)}
        onChangeText={(s) => setEngagement((e) => ({ ...e, replyRatio: num(s, 0, 1) }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t(messages.persona.policy.humanReview)}
          value={quality.humanReview}
          onChange={(humanReview) => setQuality((q) => ({ ...q, humanReview }))}
          options={[
            { value: 'always', label: t(messages.persona.policy.humanReviewAlways) },
            { value: 'first_30_days', label: t(messages.persona.policy.humanReviewFirst30) },
            { value: 'score_below_threshold', label: t(messages.persona.policy.humanReviewBelow) },
            { value: 'never', label: t(messages.persona.policy.humanReviewNever) },
          ]}
          testID="human-review"
        />
        <TextInput
          label={t(messages.persona.policy.minScore)}
          kind="number"
          value={String(quality.minScore)}
          onChangeText={(s) => setQuality((q) => ({ ...q, minScore: num(s, 0, 10) }))}
        />
      </div>

      <Button
        type="submit"
        label={t(messages.persona.wizard.next)}
        variant="primary"
        size="lg"
        loading={busy}
        disabled={windowError || rangeError}
        testID="step-next"
      />
    </form>
  );
}

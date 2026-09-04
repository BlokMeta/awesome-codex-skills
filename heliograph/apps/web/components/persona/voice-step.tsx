'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Button, SelectField, TagInput, TextInput } from '@heliograph/ui';
import { type FormEvent, useState } from 'react';
import { useT } from '@/lib/use-t';

type Voice = PersonaDto['voiceBible'];
type Topics = PersonaDto['topicProfile'];
const lines = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function VoiceStep({
  persona,
  busy,
  onSave,
}: {
  persona: PersonaDto;
  busy: boolean;
  onSave: (patch: { voiceBible: Voice; topicProfile: Topics }) => void;
}) {
  const t = useT();
  const [v, setV] = useState<Voice>(persona.voiceBible);
  const [topics, setTopics] = useState<Topics>(persona.topicProfile);
  const [samples, setSamples] = useState(persona.voiceBible.samplePosts.join('\n'));
  const [pool, setPool] = useState(persona.voiceBible.experiencePool.join('\n'));
  const set = <K extends keyof Voice>(k: K, val: Voice[K]) => setV((x) => ({ ...x, [k]: val }));
  const summaryShort = v.summary.trim().length > 0 && v.summary.trim().length < 40;
  const remove = (x: string) => `${x} ×`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      voiceBible: { ...v, samplePosts: lines(samples), experiencePool: lines(pool) },
      topicProfile: topics,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <TextInput
        label={t(messages.persona.voice.summary)}
        hint={t(messages.persona.voice.summaryHint)}
        value={v.summary}
        onChangeText={(s) => set('summary', s)}
        multiline
        required
        error={summaryShort ? t(messages.persona.voice.summaryHint) : undefined}
        testID="v-summary"
      />
      <TextInput
        label={t(messages.persona.voice.audience)}
        value={v.audience}
        onChangeText={(s) => set('audience', s)}
        testID="v-audience"
      />
      <TagInput
        label={t(messages.persona.voice.tone)}
        hint={t(messages.persona.voice.toneHint)}
        values={v.tone}
        onChange={(tone) => set('tone', tone)}
        max={8}
        removeLabel={remove}
        required
        testID="v-tone"
      />
      <SelectField
        label={t(messages.persona.voice.register)}
        value={v.register}
        onChange={(r) => set('register', r)}
        options={[
          { value: 'casual', label: t(messages.persona.voice.registerCasual) },
          { value: 'plain', label: t(messages.persona.voice.registerPlain) },
          { value: 'professional', label: t(messages.persona.voice.registerProfessional) },
          { value: 'playful', label: t(messages.persona.voice.registerPlayful) },
        ]}
        testID="v-register"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TagInput
          label={t(messages.persona.voice.doList)}
          values={v.doList}
          onChange={(x) => set('doList', x)}
          max={20}
          removeLabel={remove}
        />
        <TagInput
          label={t(messages.persona.voice.dontList)}
          values={v.dontList}
          onChange={(x) => set('dontList', x)}
          max={20}
          removeLabel={remove}
        />
      </div>
      <TextInput
        label={t(messages.persona.voice.samplePosts)}
        hint={t(messages.persona.voice.samplePostsHint)}
        value={samples}
        onChangeText={setSamples}
        multiline
        testID="v-samples"
      />
      <TextInput
        label={t(messages.persona.voice.experiencePool)}
        hint={t(messages.persona.voice.experiencePoolHint)}
        value={pool}
        onChangeText={setPool}
        multiline
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label={t(messages.persona.voice.emojiMax)}
          kind="number"
          value={String(v.emojiQuota.max)}
          onChangeText={(s) =>
            set('emojiQuota', { min: 0, max: Math.max(0, Math.min(10, Number(s) || 0)) })
          }
        />
        <TextInput
          label={t(messages.persona.voice.hashtagMax)}
          kind="number"
          value={String(v.hashtagQuota.max)}
          onChangeText={(s) =>
            set('hashtagQuota', { min: 0, max: Math.max(0, Math.min(30, Number(s) || 0)) })
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TagInput
          label={t(messages.persona.voice.topicsInclude)}
          values={topics.include}
          onChange={(include) => setTopics((x) => ({ ...x, include }))}
          max={40}
          removeLabel={remove}
          required
          testID="v-topics"
        />
        <TagInput
          label={t(messages.persona.voice.topicsExclude)}
          values={topics.exclude}
          onChange={(exclude) => setTopics((x) => ({ ...x, exclude }))}
          max={40}
          removeLabel={remove}
        />
      </div>
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

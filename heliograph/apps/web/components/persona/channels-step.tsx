'use client';

import { messages } from '@heliograph/i18n';
import { Badge, Button, EmptyState } from '@heliograph/ui';
import { useT } from '@/lib/use-t';

const PLATFORMS = ['telegram', 'threads', 'x', 'instagram', 'youtube', 'tiktok'];

/** Placeholder until the channel module (M1.2) ships OAuth and the capability matrix. */
export function ChannelsStep({ onNext }: { onNext: () => void }) {
  const t = useT();
  return (
    <div className="grid gap-5">
      <EmptyState
        title={t(messages.persona.channels.soon)}
        description={t(messages.persona.channels.hint)}
      />
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <Badge key={p} label={p} />
        ))}
      </div>
      <Button
        label={t(messages.persona.wizard.next)}
        variant="primary"
        size="lg"
        onPress={onNext}
        testID="step-next"
      />
    </div>
  );
}

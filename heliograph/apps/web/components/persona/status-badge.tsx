'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { messages } from '@heliograph/i18n';
import { Badge } from '@heliograph/ui';
import { useT } from '@/lib/use-t';

const TONE: Record<
  PersonaDto['status'],
  'neutral' | 'tide' | 'flash' | 'good' | 'warn' | 'critical'
> = {
  draft: 'neutral',
  warming: 'flash',
  active: 'good',
  paused: 'warn',
  archived: 'neutral',
};

export function StatusBadge({ status }: { status: PersonaDto['status'] }) {
  const t = useT();
  return (
    <Badge
      label={t(messages.persona.status[status])}
      tone={TONE[status]}
      dot={status !== 'archived'}
    />
  );
}

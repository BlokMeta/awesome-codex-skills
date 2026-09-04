'use client';

import type { MessageDescriptor } from '@heliograph/i18n';
import { useLingui } from '@lingui/react';
import { useCallback } from 'react';

/** `t(messages.auth.signIn)` — descriptors carry the id and the English source (docs/06). */
export function useT() {
  const { i18n } = useLingui();
  return useCallback(
    (d: MessageDescriptor, values?: Record<string, unknown>) =>
      i18n._(d.id, values, { message: d.message }),
    [i18n],
  );
}

'use client';

import type { LocaleCode } from '@heliograph/i18n';
import { setupI18n } from '@lingui/core';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import { type ReactNode, useMemo } from 'react';
import { CATALOGS } from './catalogs';

/** Provides the Lingui instance for the negotiated locale; direction is stamped on <html>. */
export function I18nProvider({ locale, children }: { locale: LocaleCode; children: ReactNode }) {
  const i18n = useMemo(() => {
    const messages = CATALOGS[locale] ?? CATALOGS['tr'] ?? {};
    return setupI18n({ locale, messages: { [locale]: messages } });
  }, [locale]);
  return <LinguiProvider i18n={i18n}>{children}</LinguiProvider>;
}

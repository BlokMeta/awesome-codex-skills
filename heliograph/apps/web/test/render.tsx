import { setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { CATALOGS } from '@/lib/catalogs';

/** Renders with the English catalog and a fresh QueryClient (no retries, no caching). */
export function renderApp(ui: ReactElement, locale = 'en') {
  const i18n = setupI18n({ locale, messages: { [locale]: CATALOGS[locale] ?? {} } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </I18nProvider>,
  );
}

import { setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { CATALOGS } from '@/lib/catalogs';

/** Renders with the given catalog and a fresh QueryClient; `rerender` keeps the providers. */
export function renderApp(ui: ReactElement, locale = 'en') {
  const i18n = setupI18n({ locale, messages: { [locale]: CATALOGS[locale] ?? {} } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

import './globals.css';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n-provider';
import { LOCALE_COOKIE, localeDirection, resolveLocale } from '@/lib/locale';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: { default: 'Heliograph', template: '%s · Heliograph' },
  description: 'Signal, not noise.',
  robots: { index: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get('accept-language'));
  return (
    <html lang={locale} dir={localeDirection(locale)} suppressHydrationWarning>
      <body>
        <I18nProvider locale={locale}>
          <QueryProvider>{children}</QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

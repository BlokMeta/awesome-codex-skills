import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALES,
  type LocaleCode,
  negotiateLocale,
} from '@heliograph/i18n';

export const LOCALE_COOKIE = 'hg.locale';

/** Server-side: cookie wins, then Accept-Language, then the default (tr). */
export function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | null | undefined,
): LocaleCode {
  if (cookieValue && isSupportedLocale(cookieValue)) return cookieValue;
  const preferred = (acceptLanguage ?? '')
    .split(',')
    .map((part) => part.split(';')[0] ?? '')
    .filter(Boolean);
  return preferred.length ? negotiateLocale(preferred) : DEFAULT_LOCALE;
}

export const localeDirection = (locale: string): 'ltr' | 'rtl' =>
  LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr';

/**
 * Locale registry (docs/06 §3). Adding a language = one entry here + a catalog folder
 * under locales/<code>/. Nothing else in the codebase changes.
 */
export interface LocaleDefinition {
  readonly code: string; // BCP-47
  readonly name: string; // endonym
  readonly dir: 'ltr' | 'rtl';
  /** Shown as "beta" in the UI while the catalog is incomplete. */
  readonly incomplete?: boolean;
  /** Development-only: never listed for real users. */
  readonly pseudo?: boolean;
}

export const LOCALES: readonly LocaleDefinition[] = [
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'en-x-pseudo', name: 'Pseudo (dev)', dir: 'ltr', pseudo: true },
];

export const DEFAULT_LOCALE = 'tr';
export const FALLBACK_LOCALE = 'en';

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const isSupportedLocale = (code: string): code is LocaleCode =>
  LOCALES.some((l) => l.code === code);

export const userFacingLocales = (): LocaleDefinition[] => LOCALES.filter((l) => !l.pseudo);

/**
 * Picks the best supported locale for an Accept-Language-style preference list.
 * "tr-TR" → "tr"; unknown → default.
 */
export function negotiateLocale(preferred: readonly string[]): LocaleCode {
  for (const raw of preferred) {
    const tag = raw.trim().toLowerCase();
    if (!tag) continue;
    const exact = LOCALES.find((l) => l.code.toLowerCase() === tag && !l.pseudo);
    if (exact) return exact.code;
    const base = tag.split('-')[0] ?? tag;
    const byBase = LOCALES.find((l) => l.code.toLowerCase() === base && !l.pseudo);
    if (byBase) return byBase.code;
  }
  return DEFAULT_LOCALE;
}

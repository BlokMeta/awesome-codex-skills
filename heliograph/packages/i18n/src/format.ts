/**
 * Intl-only formatting helpers (docs/06 §1, §5). Never format dates/numbers by hand.
 * All functions take the locale explicitly so server code (which has no "current locale")
 * and client code share the same implementation.
 */
export interface Money {
  readonly amount: string; // decimal string, never float (docs/05 §1)
  readonly currency: string; // ISO 4217
}

export function formatNumber(
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatMoney(locale: string, money: Money): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    currencyDisplay: 'narrowSymbol',
  }).format(Number(money.amount));
}

export function formatDate(
  locale: string,
  date: Date,
  timeZone: string,
  style: 'short' | 'medium' | 'long' = 'medium',
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone }).format(date);
}

export function formatDateTime(locale: string, date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** "14 dakika önce" / "in 3 hours"; under a minute → "now" in the locale's own words. */
export function formatRelative(locale: string, date: Date, now: Date): string {
  const diff = date.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' });
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(0, 'second');
}

export function formatList(
  locale: string,
  items: readonly string[],
  type: 'conjunction' | 'disjunction' = 'conjunction',
): string {
  return new Intl.ListFormat(locale, { style: 'long', type }).format(items);
}

/** Locale-aware case mapping (Turkish İ/ı; docs/06 §4). */
export const upper = (locale: string, s: string): string => s.toLocaleUpperCase(locale);
export const lower = (locale: string, s: string): string => s.toLocaleLowerCase(locale);

export function compare(locale: string): (a: string, b: string) => number {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  return (a, b) => collator.compare(a, b);
}

export function pluralCategory(locale: string, n: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(locale).select(n);
}

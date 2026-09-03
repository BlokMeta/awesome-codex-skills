import { describe, expect, it } from 'vitest';
import {
  allDescriptors,
  compare,
  createI18n,
  formatDate,
  formatList,
  formatMoney,
  formatNumber,
  formatRelative,
  lower,
  messages,
  negotiateLocale,
  parsePo,
  pluralCategory,
  poToCatalog,
  pseudoCatalog,
  pseudoLocalize,
  serializePo,
  sourceCatalog,
  translate,
  upper,
  userFacingLocales,
} from './index.js';

describe('locale registry', () => {
  it('negotiates base languages and falls back to the default', () => {
    expect(negotiateLocale(['tr-TR', 'en'])).toBe('tr');
    expect(negotiateLocale(['en-US'])).toBe('en');
    expect(negotiateLocale(['de', 'fr'])).toBe('tr');
    expect(negotiateLocale(['en-x-pseudo'])).toBe('en');
    expect(negotiateLocale([' ', ''])).toBe('tr');
  });

  it('hides the pseudo locale from users', () => {
    expect(userFacingLocales().map((l) => l.code)).toEqual(['tr', 'en']);
  });
});

describe('messages', () => {
  it('have unique dotted ids and non-empty English text', () => {
    const ds = allDescriptors();
    const ids = ds.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of ds) {
      expect(d.id).toMatch(/^[a-z]+(\.[a-zA-Z0-9]+)+$/);
      expect(d.message.length).toBeGreaterThan(0);
    }
  });

  it('render ICU plurals and placeholders through Lingui in en and tr', () => {
    const en = createI18n({ locale: 'en', catalog: sourceCatalog() });
    expect(translate(en, messages.review.pendingCount, { count: 0 })).toBe('Nothing waiting');
    expect(translate(en, messages.review.pendingCount, { count: 1 })).toBe('1 item waiting');
    expect(translate(en, messages.review.pendingCount, { count: 7 })).toBe('7 items waiting');

    const tr = createI18n({
      locale: 'tr',
      catalog: {
        'review.queue.pendingCount':
          '{count, plural, =0 {Bekleyen yok} one {# öğe bekliyor} other {# öğe bekliyor}}',
      },
      fallback: sourceCatalog(),
    });
    expect(translate(tr, messages.review.pendingCount, { count: 3 })).toBe('3 öğe bekliyor');
    expect(translate(tr, messages.common.approve)).toBe('Approve'); // fallback to source
  });

  it('pseudo-localizes every message while preserving placeholders', () => {
    const cat = pseudoCatalog();
    expect(Object.keys(cat)).toHaveLength(allDescriptors().length);
    const p = pseudoLocalize('Passed {passed} of {total} checks');
    expect(p).toContain('{passed}');
    expect(p).toContain('{total}');
    expect(p.startsWith('[')).toBe(true);
    expect(p.length).toBeGreaterThan('Passed {passed} of {total} checks'.length);
    const i18n = createI18n({ locale: 'en', catalog: cat });
    expect(translate(i18n, messages.review.gatePassed, { passed: 7, total: 8 })).toContain('7');
  });
});

describe('formatters', () => {
  const tz = 'Europe/Istanbul';
  const date = new Date('2026-09-03T12:00:00Z');

  it('use Intl for numbers, money, dates and lists', () => {
    expect(formatNumber('tr', 1234.5)).toBe('1.234,5');
    expect(formatNumber('en', 1234.5)).toBe('1,234.5');
    expect(formatMoney('en', { amount: '12.50', currency: 'USD' })).toBe('$12.50');
    expect(formatMoney('tr', { amount: '1250', currency: 'TRY' })).toMatch(/1\.250,00/);
    expect(formatDate('en', date, tz)).toBe('Sep 3, 2026');
    expect(formatDate('tr', date, tz, 'long')).toBe('3 Eylül 2026');
    expect(formatList('en', ['Instagram', 'Threads', 'X'])).toBe('Instagram, Threads, and X');
    expect(formatList('tr', ['a', 'b'], 'disjunction')).toBe('a veya b');
  });

  it('formats relative time in both directions and rounds to the largest unit', () => {
    const now = new Date('2026-09-03T12:00:00Z');
    expect(formatRelative('en', new Date('2026-09-03T11:46:00Z'), now)).toBe('14 minutes ago');
    expect(formatRelative('en', new Date('2026-09-03T15:00:00Z'), now)).toBe('in 3 hours');
    expect(formatRelative('en', new Date('2026-09-03T12:00:10Z'), now)).toBe('now');
    expect(formatRelative('tr', new Date('2026-09-01T12:00:00Z'), now)).toMatch(
      /2 gün önce|önceki gün|evvelsi gün/,
    );
  });

  it('handles Turkish dotted/dotless i and locale collation', () => {
    expect(upper('tr', 'istanbul')).toBe('İSTANBUL');
    expect(lower('tr', 'ISPARTA')).toBe('ısparta');
    expect(upper('en', 'istanbul')).toBe('ISTANBUL');
    expect(['şeker', 'sabun', 'zeytin'].sort(compare('tr'))).toEqual(['sabun', 'şeker', 'zeytin']);
    expect(['item10', 'item2'].sort(compare('en'))).toEqual(['item2', 'item10']);
    expect(pluralCategory('en', 1)).toBe('one');
    expect(pluralCategory('tr', 5)).toBe('other');
  });
});

describe('po codec', () => {
  it('round-trips entries with comments, fuzzy flags and escapes', () => {
    const entries = [
      { id: 'a.b.c', str: 'Hello "world"\nline2', fuzzy: false, comment: 'greeting' },
      { id: 'x.y.z', str: 'Taslak', fuzzy: true },
    ];
    const text = serializePo(entries, 'tr');
    const parsed = parsePo(text);
    expect(parsed).toEqual(entries);
    expect(poToCatalog(parsed)).toEqual({ 'a.b.c': 'Hello "world"\nline2' });
  });
});

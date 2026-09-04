import { describe, expect, it } from 'vitest';
import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  it('prefers the cookie, then Accept-Language, then Turkish', () => {
    expect(resolveLocale('en', 'tr-TR,tr;q=0.9')).toBe('en');
    expect(resolveLocale('xx', 'en-US,en;q=0.8')).toBe('en');
    expect(resolveLocale(undefined, 'de-DE,de;q=0.9')).toBe('tr');
    expect(resolveLocale(undefined, null)).toBe('tr');
    expect(resolveLocale('en-x-pseudo', null)).toBe('en-x-pseudo');
  });
});

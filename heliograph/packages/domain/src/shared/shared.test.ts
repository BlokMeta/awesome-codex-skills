import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { domainError } from './domain-error.js';
import { IdSchema, ulidGenerator } from './id.js';
import { fixedClock, seededRng, systemClock } from './ports.js';
import { all, andThen, err, map, ok, unwrapOr } from './result.js';

describe('Result', () => {
  it('maps and chains only on the success path', () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(map(err('e'), (n: number) => n * 2)).toEqual(err('e'));
    expect(andThen(ok(2), (n) => ok(n + 1))).toEqual(ok(3));
    expect(andThen(ok(2), () => err('boom'))).toEqual(err('boom'));
    expect(andThen(err('first'), () => ok(1))).toEqual(err('first'));
  });

  it('unwraps with a fallback', () => {
    expect(unwrapOr(ok('v'), 'fallback')).toBe('v');
    expect(unwrapOr(err('x'), 'fallback')).toBe('fallback');
  });

  it('collects all successes or stops at the first error', () => {
    expect(all([ok(1), ok(2), ok(3)])).toEqual(ok([1, 2, 3]));
    expect(all([ok(1), err('a'), err('b')])).toEqual(err('a'));
    expect(all([])).toEqual(ok([]));
  });
});

describe('domainError', () => {
  it('omits params when none are given so serialised errors stay minimal', () => {
    expect(domainError('x.y', 'errors.x.y')).toEqual({ code: 'x.y', messageId: 'errors.x.y' });
    expect(domainError('x.y', 'errors.x.y', { n: 1 })).toEqual({
      code: 'x.y',
      messageId: 'errors.x.y',
      params: { n: 1 },
    });
  });
});

describe('ports', () => {
  it('fixedClock returns a copy of the same instant every time', () => {
    const clock = fixedClock(new Date('2026-01-01T00:00:00Z'));
    const a = clock.now();
    a.setFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('systemClock is close to wall time', () => {
    expect(Math.abs(systemClock.now().getTime() - Date.now())).toBeLessThan(1000);
  });

  it('seededRng is deterministic and stays within [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const a = seededRng(seed);
        const b = seededRng(seed);
        for (let i = 0; i < 50; i++) {
          const v = a.next();
          expect(v).toBe(b.next());
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThan(1);
        }
      }),
    );
  });
});

describe('ids', () => {
  it('generates valid, monotonic-length ULIDs', () => {
    const id = ulidGenerator.next();
    expect(IdSchema.safeParse(id).success).toBe(true);
    expect(IdSchema.safeParse('not-an-id').success).toBe(false);
  });
});

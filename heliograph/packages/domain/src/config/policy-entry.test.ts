import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ageInDays,
  type PolicyEntry,
  PolicyKeySchema,
  resolveEffective,
  resolveWithFallback,
  reverify,
  staleness,
  stalenessReport,
} from './policy-entry.js';

const now = new Date('2026-09-03T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

const anEntry = (overrides: Partial<PolicyEntry> = {}): PolicyEntry => ({
  id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
  key: 'platform.instagram.publish_limit_24h',
  scope: 'global',
  scopeId: null,
  value: 100,
  version: 1,
  effectiveFrom: daysAgo(40),
  verifiedAt: daysAgo(5),
  verifiedBy: 'seed',
  sourceUrl: 'https://developers.facebook.com/docs/instagram-platform/content-publishing/',
  maxAgeDays: 30,
  notes: null,
  ...overrides,
});

describe('PolicyKeySchema', () => {
  it('accepts dotted lowercase keys and rejects everything else', () => {
    expect(PolicyKeySchema.safeParse('platform.x.price_per_post_usd').success).toBe(true);
    expect(PolicyKeySchema.safeParse('PlatformX').success).toBe(false);
    expect(PolicyKeySchema.safeParse('platform').success).toBe(false);
  });
});

describe('resolveEffective', () => {
  it('returns the highest version whose effectiveFrom is not in the future', () => {
    const v1 = anEntry();
    const v2 = anEntry({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y2',
      version: 2,
      value: 50,
      effectiveFrom: daysAgo(1),
    });
    const v3future = anEntry({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y3',
      version: 3,
      value: 25,
      effectiveFrom: new Date(now.getTime() + 86_400_000),
    });
    expect(resolveEffective([v3future, v1, v2], v1.key, now)?.value).toBe(50);
    expect(resolveEffective([v1], 'platform.threads.publish_limit_24h', now)).toBeNull();
  });

  it('falls back workspace → platform → global', () => {
    const global = anEntry({ value: 100 });
    const platform = anEntry({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y4',
      scope: 'platform',
      scopeId: 'instagram',
      value: 80,
    });
    const ws = anEntry({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y5',
      scope: 'workspace',
      scopeId: 'ws1',
      value: 10,
    });
    const all = [global, platform, ws];
    expect(
      resolveWithFallback(all, global.key, now, { workspaceId: 'ws1', platform: 'instagram' })
        ?.value,
    ).toBe(10);
    expect(
      resolveWithFallback(all, global.key, now, { workspaceId: 'ws2', platform: 'instagram' })
        ?.value,
    ).toBe(80);
    expect(resolveWithFallback(all, global.key, now, { platform: 'threads' })?.value).toBe(100);
    expect(resolveWithFallback(all, global.key, now)?.value).toBe(100);
  });
});

describe('staleness', () => {
  it('is fresh within maxAgeDays, warning after, critical after twice the age', () => {
    expect(staleness(anEntry({ verifiedAt: daysAgo(29) }), now).level).toBe('fresh');
    expect(staleness(anEntry({ verifiedAt: daysAgo(31) }), now)).toMatchObject({
      level: 'warning',
      overdueDays: 1,
      ageDays: 31,
    });
    expect(staleness(anEntry({ verifiedAt: daysAgo(60) }), now).level).toBe('critical');
  });

  it('never reports negative age for future verification stamps (clock skew)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 1, max: 365 }),
        (days, maxAge) => {
          const s = staleness(anEntry({ verifiedAt: daysAgo(days), maxAgeDays: maxAge }), now);
          expect(s.ageDays).toBeGreaterThanOrEqual(0);
          expect(s.overdueDays).toBe(Math.max(0, s.ageDays - maxAge));
          expect(s.level === 'fresh').toBe(s.overdueDays === 0);
        },
      ),
    );
  });

  it('reports one line per effective key/scope, stale first', () => {
    const fresh = anEntry({
      key: 'llm.writer.model',
      value: 'claude-opus-5',
      maxAgeDays: 60,
      verifiedAt: daysAgo(3),
    });
    const stale = anEntry({ verifiedAt: daysAgo(45) });
    const staleOld = anEntry({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y9',
      version: 0,
      verifiedAt: daysAgo(400),
    });
    const report = stalenessReport([fresh, stale, staleOld], now);
    expect(report.map((r) => r.key)).toEqual([stale.key, fresh.key]);
    expect(report[0]?.overdueDays).toBe(15);
    expect(ageInDays(fresh, now)).toBe(3);
  });
});

describe('reverify', () => {
  it('stamps a new verification without bumping the version when the value is unchanged', () => {
    const e = anEntry({ verifiedAt: daysAgo(45) });
    const r = reverify(e, 'ayberk', now);
    expect(r.version).toBe(1);
    expect(r.verifiedAt).toBe(now);
    expect(r.verifiedBy).toBe('ayberk');
    expect(r.effectiveFrom).toBe(e.effectiveFrom);
  });

  it('bumps the version and effectiveFrom when the value changes', () => {
    const e = anEntry();
    const r = reverify(
      e,
      'watcher',
      now,
      { value: 50, notes: 'limit reduced by Meta' },
      '01J8Z3M9K2Q4R5S6T7V8W9X0Z0',
    );
    expect(r.version).toBe(2);
    expect(r.value).toBe(50);
    expect(r.effectiveFrom).toBe(now);
    expect(r.id).toBe('01J8Z3M9K2Q4R5S6T7V8W9X0Z0');
    expect(resolveEffective([e, r], e.key, now)?.value).toBe(50);
  });
});

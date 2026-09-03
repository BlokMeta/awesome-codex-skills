import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  assertEntitlement,
  type CreditEntry,
  creditBalance,
  creditWarningLevel,
  spendCredits,
  toEntitlements,
} from './entitlement.js';

const creator = toEntitlements([
  { feature: 'connected_accounts', limit: 6 },
  { feature: 'personas', limit: 3 },
  { feature: 'daily_posts', limit: 8 },
  { feature: 'video_pipeline', limit: null },
  { feature: 'white_label', limit: 0 },
]);

describe('assertEntitlement', () => {
  it('allows within limit and reports the remainder', () => {
    const r = assertEntitlement(creator, 'connected_accounts', 5);
    expect(r.ok && r.value.remainingAfter).toBe(0);
  });

  it('rejects when the request would exceed the limit, with i18n params', () => {
    const r = assertEntitlement(creator, 'connected_accounts', 6);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('billing.entitlement_exceeded');
      expect(r.error.params).toEqual({
        feature: 'connected_accounts',
        limit: 6,
        used: 6,
        requested: 1,
      });
    }
  });

  it('treats null as unlimited, 0 as disabled and missing as not-in-plan', () => {
    expect(assertEntitlement(creator, 'video_pipeline', 10_000, 500).ok).toBe(true);
    expect(
      !assertEntitlement(creator, 'white_label', 0).ok &&
        assertEntitlement(creator, 'white_label', 0),
    ).toMatchObject({
      error: { code: 'billing.feature_disabled' },
    });
    expect(assertEntitlement(creator, 'api_access', 0)).toMatchObject({
      ok: false,
      error: { code: 'billing.feature_not_in_plan' },
    });
  });

  it('never allows used + requested to pass a finite limit', () => {
    fc.assert(
      fc.property(
        fc.nat(50),
        fc.nat(50),
        fc.integer({ min: 1, max: 20 }),
        (limit, used, requested) => {
          const ents = toEntitlements([{ feature: 'daily_posts', limit }]);
          const r = assertEntitlement(ents, 'daily_posts', used, requested);
          expect(r.ok).toBe(limit > 0 && used + requested <= limit);
        },
      ),
    );
  });
});

describe('credits', () => {
  const now = new Date('2026-09-03T00:00:00Z');
  const ledger: CreditEntry[] = [
    { delta: 2000, reason: 'plan_grant', at: now },
    { delta: -25, reason: 'usage', at: now },
    { delta: 100, reason: 'bonus', at: now },
  ];

  it('sums the ledger and spends only what is available', () => {
    expect(creditBalance(ledger)).toBe(2075);
    const r = spendCredits(ledger, 60, now);
    expect(r.ok && r.value.balanceAfter).toBe(2015);
    expect(r.ok && r.value.entry).toEqual({ delta: -60, reason: 'usage', at: now });
    expect(spendCredits(ledger, 3000, now)).toMatchObject({
      ok: false,
      error: { code: 'billing.insufficient_credits' },
    });
    expect(spendCredits(ledger, 0, now)).toMatchObject({
      ok: false,
      error: { code: 'billing.invalid_amount' },
    });
    expect(spendCredits(ledger, 1.5, now)).toMatchObject({
      ok: false,
      error: { code: 'billing.invalid_amount' },
    });
  });

  it('warns at 80% of the monthly grant and flags exhaustion', () => {
    expect(creditWarningLevel(2000, 2000)).toBe('ok');
    expect(creditWarningLevel(400, 2000)).toBe('warning');
    expect(creditWarningLevel(401, 2000)).toBe('ok');
    expect(creditWarningLevel(0, 2000)).toBe('exhausted');
    expect(creditWarningLevel(5, 0)).toBe('ok');
  });
});

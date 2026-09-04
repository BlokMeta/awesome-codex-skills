import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, expectRlsViolation } from '../../../../test/support/db.js';
import type { DatabaseHandle } from '../../../db/client.js';
import { withWorkspace } from '../../../db/tenant.js';
import {
  DrizzleCreditLedgerRepository,
  DrizzlePlanRepository,
  DrizzleSubscriptionRepository,
  DrizzleUsageRepository,
} from './drizzle-billing.repositories.js';
import { creditLedger } from './schema.js';
import { seedPlans } from './seed.js';

let handle: DatabaseHandle;
let plans: DrizzlePlanRepository;
let subs: DrizzleSubscriptionRepository;
let usage: DrizzleUsageRepository;
let credits: DrizzleCreditLedgerRepository;
const t0 = new Date('2026-09-03T12:00:00Z');

beforeAll(async () => {
  handle = await createTestDatabase();
  plans = new DrizzlePlanRepository(handle.db);
  subs = new DrizzleSubscriptionRepository(handle.db);
  usage = new DrizzleUsageRepository(handle.db);
  credits = new DrizzleCreditLedgerRepository(handle.db);
});
afterAll(() => handle.close());

describe('plan catalogue', () => {
  it('seeds idempotently and exposes public plans with entitlements', async () => {
    expect(await seedPlans(plans)).toBe(6);
    expect(await seedPlans(plans)).toBe(6);
    const pub = await plans.listPublic();
    expect(pub.map((p) => p.code)).toEqual(['free', 'solo', 'creator', 'studio', 'agency']);
    const creator = await plans.findByCode('creator');
    if (!creator) throw new Error('creator missing');
    expect(await plans.findById(creator.id)).toMatchObject({ code: 'creator', priceMinor: 4900 });
    const ents = await plans.entitlements(creator.id);
    expect(ents.find((e) => e.feature === 'daily_videos')?.limit).toBe(3);
    expect(ents.find((e) => e.feature === 'video_pipeline')?.limit).toBeNull();
    expect(ents.find((e) => e.feature === 'white_label')?.limit).toBe(0);
    expect(await plans.findByCode('nope')).toBeNull();
    expect(await plans.findById('nope')).toBeNull();
  });

  it('upsert replaces entitlements and keeps the plan id stable', async () => {
    const before = await plans.findByCode('solo');
    await plans.upsert(
      {
        code: 'solo',
        name: 'Solo+',
        interval: 'month',
        priceMinor: 2100,
        currency: 'USD',
        active: true,
        public: true,
        sort: 10,
      },
      [{ feature: 'daily_posts', limit: 6 }],
    );
    const after = await plans.findByCode('solo');
    expect(after?.id).toBe(before?.id);
    expect(after).toMatchObject({ name: 'Solo+', priceMinor: 2100 });
    expect(await plans.entitlements(after?.id ?? '')).toEqual([
      { feature: 'daily_posts', limit: 6 },
    ]);
  });
});

describe('subscriptions, usage and credits (tenant-scoped)', () => {
  it('stores and returns the latest subscription per workspace', async () => {
    const free = await plans.findByCode('free');
    if (!free) throw new Error('free missing');
    const base = {
      workspaceId: 'ws_a',
      planId: free.id,
      provider: 'manual' as const,
      providerRef: null,
      status: 'active' as const,
      currentPeriodStart: t0,
      currentPeriodEnd: new Date('2026-10-03T12:00:00Z'),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      seats: 1,
      extraAccounts: 0,
    };
    await subs.save({ ...base, id: '01J8Z3M9K2Q4R5S6T7V8W9X0S1' });
    await subs.save({ ...base, id: '01J8Z3M9K2Q4R5S6T7V8W9X0S2', status: 'trialing' });
    await subs.save({ ...base, id: '01J8Z3M9K2Q4R5S6T7V8W9X0S2', status: 'active', seats: 2 });
    expect(await subs.findLatest('ws_a')).toMatchObject({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0S2',
      seats: 2,
    });
    expect(await subs.findLatest('ws_b')).toBeNull();
  });

  it('sums usage per feature inside a window', async () => {
    const rec = (id: string, at: Date, quantity = 1) => ({
      id,
      workspaceId: 'ws_a',
      feature: 'daily_posts' as const,
      module: 'publishing',
      provider: null,
      model: null,
      unit: 'post',
      quantity,
      costUsd: 0,
      refType: 'post',
      refId: id,
      at,
    });
    await usage.record(rec('u1', new Date('2026-09-03T08:00:00Z')));
    await usage.record(rec('u2', new Date('2026-09-03T23:59:59Z'), 2));
    await usage.record(rec('u3', new Date('2026-09-04T00:00:00Z')));
    const day = await usage.usedInWindow(
      'ws_a',
      'daily_posts',
      new Date('2026-09-03T00:00:00Z'),
      new Date('2026-09-04T00:00:00Z'),
    );
    expect(day).toBe(3);
    expect(
      await usage.usedInWindow('ws_a', 'daily_videos', new Date(0), new Date('2027-01-01')),
    ).toBe(0);
    expect(
      await usage.usedInWindow('ws_b', 'daily_posts', new Date(0), new Date('2027-01-01')),
    ).toBe(0);
  });

  it('appends credit entries with a running balance', async () => {
    expect(await credits.balance('ws_a')).toBe(0);
    expect(await credits.append('ws_a', { delta: 300, reason: 'plan_grant', at: t0 })).toBe(300);
    expect(
      await credits.append('ws_a', {
        delta: -25,
        reason: 'usage',
        at: new Date(t0.getTime() + 1),
        refType: 'render',
        refId: 'r1',
      }),
    ).toBe(275);
    expect(await credits.balance('ws_a')).toBe(275);
    expect(await credits.balance('ws_b')).toBe(0);
  });

  it('keeps tenants apart under RLS', async () => {
    const leaked = await withWorkspace(handle.db, 'ws_b', (tx) => tx.select().from(creditLedger));
    expect(leaked).toEqual([]);
    const smuggled = {
      id: 'x',
      workspaceId: 'ws_a',
      delta: 1,
      reason: 'bonus' as const,
      balanceAfter: 1,
      at: t0,
    };
    await expectRlsViolation(
      withWorkspace(handle.db, 'ws_b', (tx) => tx.insert(creditLedger).values(smuggled)),
    );
  });
});

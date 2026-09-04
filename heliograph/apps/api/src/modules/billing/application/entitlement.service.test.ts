import {
  type CreditLedgerRepository,
  type Entitlement,
  fixedClock,
  type Plan,
  type PlanRepository,
  type Subscription,
  type SubscriptionRepository,
  type UsageRepository,
} from '@heliograph/domain';
import { describe, expect, it } from 'vitest';
import { EntitlementService } from './entitlement.service.js';

const now = new Date('2026-09-15T10:00:00Z');
const plan = (code: string, ents: Entitlement[]): [Plan, Entitlement[]] => [
  {
    id: `p_${code}`,
    code,
    name: code,
    interval: 'month',
    priceMinor: 0,
    currency: 'USD',
    active: true,
    public: true,
    sort: 0,
  },
  ents,
];
const catalogue = new Map<string, [Plan, Entitlement[]]>([
  [
    'free',
    plan('free', [
      { feature: 'daily_posts', limit: 1 },
      { feature: 'personas', limit: 1 },
      { feature: 'video_pipeline', limit: 0 },
      { feature: 'ai_credits_month', limit: 30 },
    ]),
  ],
  [
    'creator',
    plan('creator', [
      { feature: 'daily_posts', limit: 8 },
      { feature: 'personas', limit: 3 },
      { feature: 'video_pipeline', limit: null },
      { feature: 'ai_credits_month', limit: 1200 },
    ]),
  ],
]);
const plans: PlanRepository = {
  findByCode: async (c) => catalogue.get(c)?.[0] ?? null,
  findById: async (id) => [...catalogue.values()].find(([p]) => p.id === id)?.[0] ?? null,
  listPublic: async () => [...catalogue.values()].map(([p]) => p),
  entitlements: async (id) => [...catalogue.values()].find(([p]) => p.id === id)?.[1] ?? [],
  upsert: async () => undefined,
};
const usageByFeature: Record<string, number> = { daily_posts: 7, ai_credits_month: 1000 };
const usage: UsageRepository = {
  record: async () => undefined,
  usedInWindow: async (_ws, feature) => usageByFeature[feature] ?? 0,
};
const credits: CreditLedgerRepository = { balance: async () => 150, append: async () => 150 };
const config = { get: async <T>(_k: string, parse: (v: unknown) => T) => parse(0.8) };

function service(sub: Subscription | null) {
  const subs: SubscriptionRepository = { findLatest: async () => sub, save: async () => undefined };
  return new EntitlementService(plans, subs, usage, credits, config, fixedClock(now));
}
const creatorSub = (status: Subscription['status']): Subscription => ({
  id: 's1',
  workspaceId: 'ws',
  planId: 'p_creator',
  provider: 'paddle',
  providerRef: 'sub_1',
  status,
  currentPeriodStart: new Date('2026-09-01T00:00:00Z'),
  currentPeriodEnd: new Date('2026-10-01T00:00:00Z'),
  cancelAtPeriodEnd: false,
  trialEndsAt: null,
  seats: 1,
  extraAccounts: 0,
});

describe('EntitlementService', () => {
  it('falls back to the Free plan without an entitled subscription', async () => {
    expect((await service(null).resolve('ws')).plan.code).toBe('free');
    expect((await service(creatorSub('cancelled')).resolve('ws')).plan.code).toBe('free');
    expect((await service(creatorSub('past_due')).resolve('ws')).plan.code).toBe('creator');
  });

  it('checks daily consumption against the plan (7 used of 8 → one more ok, two not)', async () => {
    const svc = service(creatorSub('active'));
    expect((await svc.assert('ws', 'daily_posts')).ok).toBe(true);
    const over = await svc.assert('ws', 'daily_posts', { requested: 2 });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.error.code).toBe('billing.entitlement_exceeded');
  });

  it('count features need the caller to pass the current count; flags are on/off', async () => {
    const svc = service(null);
    const missing = await svc.assert('ws', 'personas');
    expect(missing.ok).toBe(false);
    expect((await svc.assert('ws', 'personas', { currentCount: 0 })).ok).toBe(true);
    expect((await svc.assert('ws', 'personas', { currentCount: 1 })).ok).toBe(false);
    const off = await svc.assert('ws', 'video_pipeline');
    expect(off.ok).toBe(false);
    if (!off.ok) expect(off.error.code).toBe('billing.feature_disabled');
    expect((await service(creatorSub('active')).assert('ws', 'video_pipeline')).ok).toBe(true);
    const notInPlan = await svc.assert('ws', 'white_label');
    expect(notInPlan.ok).toBe(false);
  });

  it('overview lists lines with usage for consumption features and credit warning', async () => {
    const { resolved, lines, credits: c } = await service(creatorSub('trialing')).overview('ws');
    expect(resolved.plan.code).toBe('creator');
    expect(lines.find((l) => l.feature === 'daily_posts')).toEqual({
      feature: 'daily_posts',
      kind: 'daily',
      limit: 8,
      used: 7,
      remaining: 1,
    });
    expect(lines.find((l) => l.feature === 'personas')).toEqual({
      feature: 'personas',
      kind: 'count',
      limit: 3,
      used: null,
      remaining: null,
    });
    expect(lines.find((l) => l.feature === 'video_pipeline')?.limit).toBeNull();
    expect(c).toEqual({ balance: 150, monthlyGrant: 1200, warning: 'warning' });
  });
});

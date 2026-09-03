import { fixedClock, type PolicyEntry } from '@heliograph/domain';
import { describe, expect, it } from 'vitest';
import { InMemoryPolicyRepository } from '../infrastructure/in-memory-policy.repository.js';
import { ConfigService } from './config.service.js';

const now = new Date('2026-09-03T12:00:00Z');
const entry = (over: Partial<PolicyEntry>): PolicyEntry => ({
  id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
  key: 'platform.publish_limit_24h',
  scope: 'platform',
  scopeId: 'instagram',
  value: 100,
  version: 1,
  effectiveFrom: now,
  verifiedAt: now,
  verifiedBy: 'seed',
  sourceUrl: null,
  maxAgeDays: 30,
  notes: null,
  ...over,
});

describe('ConfigService', () => {
  it('reads through the repository, caches with a TTL and honours invalidate()', async () => {
    const repo = new InMemoryPolicyRepository([entry({})]);
    const svc = new ConfigService(repo, fixedClock(now), 1000);
    const num = (v: unknown) => Number(v);
    expect(await svc.get('platform.publish_limit_24h', num, { platform: 'instagram' })).toBe(100);
    await repo.save(entry({ id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y2', version: 2, value: 50 }));
    expect(await svc.get('platform.publish_limit_24h', num, { platform: 'instagram' })).toBe(100); // cached
    svc.invalidate('platform.publish_limit_24h');
    expect(await svc.get('platform.publish_limit_24h', num, { platform: 'instagram' })).toBe(50);
    svc.invalidate();
    await expect(svc.get('nope.key', num)).rejects.toThrow('config key missing');
  });

  it('reports staleness from the repository', async () => {
    const repo = new InMemoryPolicyRepository([
      entry({ verifiedAt: new Date(now.getTime() - 45 * 86_400_000) }),
    ]);
    const svc = new ConfigService(repo, fixedClock(now));
    const report = await svc.staleness();
    expect(report[0]).toMatchObject({ level: 'warning', overdueDays: 15 });
  });
});

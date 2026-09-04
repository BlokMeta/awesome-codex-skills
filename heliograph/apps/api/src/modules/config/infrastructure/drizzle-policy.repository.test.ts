import type { PolicyEntry } from '@heliograph/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, expectRlsViolation } from '../../../../test/support/db.js';
import type { DatabaseHandle } from '../../../db/client.js';
import { withWorkspace } from '../../../db/tenant.js';
import { DrizzlePolicyRepository } from './drizzle-policy.repository.js';
import { seedEntries } from './seed.js';

let handle: DatabaseHandle;
let repo: DrizzlePolicyRepository;
const now = new Date('2026-09-03T12:00:00Z');

const entry = (over: Partial<PolicyEntry>): PolicyEntry => ({
  id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
  key: 'test.limit',
  scope: 'global',
  scopeId: null,
  value: { n: 1 },
  version: 1,
  effectiveFrom: now,
  verifiedAt: now,
  verifiedBy: 'test',
  sourceUrl: 'https://example.com/doc',
  maxAgeDays: 30,
  notes: null,
  ...over,
});

beforeAll(async () => {
  handle = await createTestDatabase();
  repo = new DrizzlePolicyRepository(handle.db);
});
afterAll(() => handle.close());

describe('DrizzlePolicyRepository', () => {
  it('seeds idempotently and reads back typed entries', async () => {
    const seed = seedEntries(now);
    expect(await repo.seedIfMissing(seed)).toBe(seed.length);
    expect(await repo.seedIfMissing(seed)).toBe(0);
    const all = await repo.listEffective();
    expect(all.length).toBe(seed.length);
    const first = seed[0];
    if (!first) throw new Error('seed empty');
    const found = await repo.findByKey(first.key);
    expect(found[0]).toMatchObject({ key: first.key, value: first.value, version: 1 });
    expect(found[0]?.verifiedAt).toBeInstanceOf(Date);
  });

  it('save() on an existing id re-verifies without changing the value; a new version is a new row', async () => {
    await repo.save(entry({}));
    await repo.save(entry({ value: { n: 999 }, verifiedAt: new Date('2026-10-01T00:00:00Z') }));
    const [v1] = await repo.findByKey('test.limit');
    expect(v1?.value).toEqual({ n: 1 });
    expect(v1?.verifiedAt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    await repo.save(entry({ id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y2', version: 2, value: { n: 2 } }));
    expect((await repo.findByKey('test.limit')).map((e) => e.version).sort()).toEqual([1, 2]);
  });

  it('rejects a duplicate (key, scope, scopeId, version) under a different id', async () => {
    await expect(repo.save(entry({ id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y3' }))).rejects.toThrow();
  });

  it("hides another workspace's override inside a tenant transaction (RLS)", async () => {
    await repo.save(
      entry({
        id: '01J8Z3M9K2Q4R5S6T7V8W9X0A1',
        key: 'test.ws',
        scope: 'workspace',
        scopeId: 'ws_a',
      }),
    );
    await repo.save(
      entry({
        id: '01J8Z3M9K2Q4R5S6T7V8W9X0B1',
        key: 'test.ws',
        scope: 'workspace',
        scopeId: 'ws_b',
      }),
    );
    const seenByA = await withWorkspace(handle.db, 'ws_a', (tx) =>
      new DrizzlePolicyRepository(tx).findByKey('test.ws'),
    );
    expect(seenByA.map((e) => e.scopeId)).toEqual(['ws_a']);
    const globalsVisible = await withWorkspace(handle.db, 'ws_a', (tx) =>
      new DrizzlePolicyRepository(tx).findByKey('test.limit'),
    );
    expect(globalsVisible.length).toBe(2);
    await expectRlsViolation(
      withWorkspace(handle.db, 'ws_a', (tx) =>
        new DrizzlePolicyRepository(tx).save(
          entry({
            id: '01J8Z3M9K2Q4R5S6T7V8W9X0C1',
            key: 'test.ws2',
            scope: 'workspace',
            scopeId: 'ws_b',
          }),
        ),
      ),
    );
  });
});

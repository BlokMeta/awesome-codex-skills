import { createDraft, type Persona } from '@heliograph/domain';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../test/support/db.js';
import type { DatabaseHandle } from '../../../db/client.js';
import { withWorkspace } from '../../../db/tenant.js';
import { DrizzlePersonaRepository } from './drizzle-persona.repository.js';
import { personas, personaVersions } from './schema.js';

let handle: DatabaseHandle;
let repo: DrizzlePersonaRepository;
const WS = '01J8Z3M9K2Q4R5S6T7V8W9X0W1';
const OTHER = '01J8Z3M9K2Q4R5S6T7V8W9X0W2';

const draft = (id: string, slug: string, workspaceId = WS): Persona => {
  const r = createDraft({
    id,
    workspaceId,
    slug,
    name: slug,
    niche: 'devops',
    language: 'tr',
    timezone: 'Europe/Istanbul',
  });
  if (!r.ok) throw new Error(r.error.code);
  return r.value;
};
const ids = Array.from({ length: 7 }, (_, i) => `01J8Z3M9K2Q4R5S6T7V8W9X0P${i}`);

beforeAll(async () => {
  handle = await createTestDatabase();
  repo = new DrizzlePersonaRepository(handle.db);
});
afterAll(() => handle.close());

describe('DrizzlePersonaRepository', () => {
  it('saves drafts, finds by id/slug, versions every overwrite', async () => {
    const saved = await repo.save(draft(ids[0] ?? '', 'deniz'), {
      changedBy: 'op',
      reason: 'create',
    });
    expect(saved.status).toBe('draft');
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect((await repo.findBySlug(WS, 'deniz'))?.id).toBe(ids[0]);
    expect(await repo.findById(WS, 'nope')).toBeNull();

    const renamed = await repo.save(
      { ...saved, name: 'Deniz v2' },
      { changedBy: 'op', reason: 'rename' },
    );
    expect(renamed.name).toBe('Deniz v2');
    const versions = await withWorkspace(handle.db, WS, (tx) => tx.select().from(personaVersions));
    expect(versions.map((v) => v.reason)).toEqual(['rename']);
    const snapshot = versions[0]?.snapshot as { name: string } | undefined;
    expect(snapshot?.name).toBe('deniz');
  });

  it('paginates newest-first by (createdAt, id) with a stable keyset and filters by status', async () => {
    for (let i = 1; i < ids.length; i++) {
      await repo.save(draft(ids[i] ?? '', `p-${i}`), { changedBy: 'op', reason: null });
      await handle.db.execute(sql`select pg_sleep(0.01)`);
    }
    const first = await repo.list(WS, { limit: 3 });
    expect(first.items.length).toBe(3);
    expect(first.hasMore).toBe(true);
    const last = first.items.at(-1);
    if (!last) throw new Error('empty');
    const second = await repo.list(WS, {
      limit: 3,
      after: { createdAt: last.createdAt, id: last.id },
    });
    const seen = new Set([...first.items, ...second.items].map((p) => p.id));
    expect(seen.size).toBe(6);
    const third = await repo.list(WS, {
      limit: 3,
      after: {
        createdAt: second.items.at(-1)?.createdAt ?? new Date(),
        id: second.items.at(-1)?.id ?? '',
      },
    });
    expect(third.items.length).toBe(1);
    expect(third.hasMore).toBe(false);
    expect((await repo.list(WS, { limit: 10, status: 'active' })).items).toEqual([]);
    expect(await repo.countActive(WS)).toBe(7);
  });

  it('enforces slug uniqueness per workspace and isolates tenants', async () => {
    await expect(
      repo.save(draft('01J8Z3M9K2Q4R5S6T7V8W9X0PX', 'deniz'), { changedBy: 'op', reason: null }),
    ).rejects.toThrow();
    await repo.save(draft('01J8Z3M9K2Q4R5S6T7V8W9X0PY', 'deniz', OTHER), {
      changedBy: 'op',
      reason: null,
    });
    expect((await repo.list(OTHER, { limit: 10 })).items.map((p) => p.id)).toEqual([
      '01J8Z3M9K2Q4R5S6T7V8W9X0PY',
    ]);
    expect(await repo.findById(OTHER, ids[0] ?? '')).toBeNull();
    const leaked = await withWorkspace(handle.db, OTHER, (tx) =>
      tx.select().from(personas).where(sql`workspace_id = ${WS}`),
    );
    expect(leaked).toEqual([]);
  });
});

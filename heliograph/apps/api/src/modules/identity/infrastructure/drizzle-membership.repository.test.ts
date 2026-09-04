import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, expectRlsViolation, rowsOf } from '../../../../test/support/db.js';
import type { DatabaseHandle } from '../../../db/client.js';
import { withWorkspace } from '../../../db/tenant.js';
import { DrizzleMembershipRepository } from './drizzle-membership.repository.js';
import { DrizzleWorkspaceRepository } from './drizzle-workspace.repository.js';
import { memberships, operators } from './schema.js';

let handle: DatabaseHandle;
let members: DrizzleMembershipRepository;
let workspaces: DrizzleWorkspaceRepository;
const t0 = new Date('2026-09-03T12:00:00Z');

beforeAll(async () => {
  handle = await createTestDatabase();
  members = new DrizzleMembershipRepository(handle.db);
  workspaces = new DrizzleWorkspaceRepository(handle.db);
  await handle.db.insert(operators).values([
    { id: 'op_ayse', email: 'Ayse@Example.com', name: 'Ayşe' },
    { id: 'op_bora', email: 'bora@example.com', name: 'Bora' },
  ]);
  await workspaces.create(
    {
      id: 'ws_a',
      name: 'Atölye A',
      slug: 'atolye-a',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      createdAt: t0,
    },
    { operatorId: 'op_ayse' },
  );
  await workspaces.create(
    {
      id: 'ws_b',
      name: 'Studio B',
      slug: 'studio-b',
      locale: 'en',
      timezone: 'UTC',
      createdAt: t0,
    },
    { operatorId: 'op_bora' },
  );
});
afterAll(() => handle.close());

describe('workspaces + memberships (Drizzle, RLS)', () => {
  it('creates a workspace with its first owner in one transaction', async () => {
    expect(await workspaces.findById('ws_a')).toMatchObject({ name: 'Atölye A', locale: 'tr' });
    expect((await workspaces.listByIds(['ws_a', 'ws_b', 'nope'])).map((w) => w.slug)).toEqual(
      expect.arrayContaining(['atolye-a', 'studio-b']),
    );
    expect(await workspaces.listByIds([])).toEqual([]);
    expect(await workspaces.findById('nope')).toBeNull();
    expect(await members.listForWorkspace('ws_a')).toMatchObject([
      { operatorId: 'op_ayse', role: 'owner', workspaceId: 'ws_a' },
    ]);
  });

  it('email uniqueness is case-insensitive', async () => {
    await expect(
      handle.db.insert(operators).values({ id: 'op_dup', email: 'ayse@example.com' }),
    ).rejects.toThrow();
  });

  it('upsert, setRole, remove are tenant-scoped; listForOperator spans tenants', async () => {
    await members.upsert({
      id: 'm_bora_in_a',
      workspaceId: 'ws_a',
      operatorId: 'op_bora',
      role: 'viewer',
      invitedBy: 'op_ayse',
      acceptedAt: null,
    });
    await members.upsert({
      id: 'm_bora_in_a',
      workspaceId: 'ws_a',
      operatorId: 'op_bora',
      role: 'editor',
      invitedBy: 'op_ayse',
      acceptedAt: t0,
    });
    expect((await members.listForOperator('op_bora')).map((m) => [m.workspaceId, m.role])).toEqual(
      expect.arrayContaining([
        ['ws_a', 'editor'],
        ['ws_b', 'owner'],
      ]),
    );
    await members.setRole('ws_a', 'op_bora', 'admin');
    expect(
      (await members.listForWorkspace('ws_a')).find((m) => m.operatorId === 'op_bora')?.role,
    ).toBe('admin');
    await members.remove('ws_a', 'op_bora');
    expect((await members.listForWorkspace('ws_a')).map((m) => m.operatorId)).toEqual(['op_ayse']);
  });

  it("a tenant transaction cannot read, update or insert another workspace's rows", async () => {
    const leaked = await withWorkspace(handle.db, 'ws_a', (tx) =>
      tx.select().from(memberships).where(sql`workspace_id = 'ws_b'`),
    );
    expect(leaked).toEqual([]);
    const updated = await withWorkspace(handle.db, 'ws_a', (tx) =>
      tx.update(memberships).set({ role: 'viewer' }).where(sql`workspace_id = 'ws_b'`).returning(),
    );
    expect(updated).toEqual([]);
    await expectRlsViolation(
      withWorkspace(handle.db, 'ws_a', (tx) =>
        tx.insert(memberships).values({
          id: 'm_smuggle',
          workspaceId: 'ws_b',
          operatorId: 'op_ayse',
          role: 'owner',
        }),
      ),
    );
    await expect(withWorkspace(handle.db, "x'; drop table t;--", async () => 1)).rejects.toThrow(
      'invalid workspace id',
    );
  });

  it('the tenant context does not leak past the transaction', async () => {
    await withWorkspace(handle.db, 'ws_a', async (tx) => {
      const [row] = rowsOf<{ u: string }>(await tx.execute(sql`select current_user as u`));
      expect(row?.u).toBe('hg_app');
    });
    const rows = await handle.db.select().from(memberships);
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});

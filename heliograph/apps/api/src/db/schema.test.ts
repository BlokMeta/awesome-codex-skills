import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as schema from './schema.js';

const tables = Object.entries(schema).filter(
  (e): e is [string, PgTable] => typeof e[1] === 'object' && 'getSQL' in (e[1] as object),
);

/**
 * Rule 14 (CLAUDE.md): every row that carries workspace_id is tenant-isolated by RLS.
 * This test fails the moment a module adds a tenant table without a policy.
 */
describe('schema invariants', () => {
  it('every table with a workspace_id column has RLS enabled and a tenant policy', () => {
    for (const [name, table] of tables) {
      const cfg = getTableConfig(table);
      const hasWorkspaceId = cfg.columns.some((c) => c.name === 'workspace_id');
      if (!hasWorkspaceId) continue;
      expect(cfg.enableRLS, `${name}: enableRLS()`).toBe(true);
      expect(cfg.policies.length, `${name}: pgPolicy`).toBeGreaterThan(0);
      for (const p of cfg.policies) expect(p.to).toBe('hg_app');
    }
  });

  it('policy_entries is RLS-guarded even though its tenant column is scope_id', () => {
    const cfg = getTableConfig(schema.policyEntries);
    expect(cfg.enableRLS).toBe(true);
    expect(cfg.policies.map((p) => p.name)).toEqual(['policy_entries_scope_visibility']);
  });

  it('foreign keys point at the identity tables and cascade on workspace deletion', () => {
    const fks = getTableConfig(schema.memberships).foreignKeys.map((fk) => {
      const ref = fk.reference();
      return [ref.foreignTable === schema.workspaces ? 'workspaces' : 'operators', fk.onDelete];
    });
    expect(fks).toEqual(
      expect.arrayContaining([
        ['workspaces', 'cascade'],
        ['operators', 'cascade'],
        ['operators', 'set null'],
      ]),
    );
    const inv = getTableConfig(schema.invitations).foreignKeys.map(
      (fk) => fk.reference().foreignTable,
    );
    expect(inv).toEqual(expect.arrayContaining([schema.workspaces, schema.operators]));
  });

  it('every table has a text ULID primary key (or a composite key for pure join tables)', () => {
    for (const [name, table] of tables) {
      const cfg = getTableConfig(table);
      const pk = cfg.columns.find((c) => c.primary);
      if (!pk) {
        expect(cfg.primaryKeys.length, `${name}: composite primary key`).toBe(1);
        continue;
      }
      // oauth_states is keyed by the random OAuth `state` itself (single use, then deleted).
      expect(pk.name, name).toBe(cfg.name === 'oauth_states' ? 'state' : 'id');
      expect(pk.dataType, name).toBe('string');
    }
  });
});

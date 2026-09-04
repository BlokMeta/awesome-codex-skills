import type { Workspace, WorkspaceRepository } from '@heliograph/domain';
import { eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../../../db/client.js';
import { withoutTenant } from '../../../db/tenant.js';
import { memberships, workspaces } from './schema.js';

type Row = typeof workspaces.$inferSelect;
const toWorkspace = (row: Row): Workspace => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  locale: row.locale,
  timezone: row.timezone,
  createdAt: row.createdAt,
});

/**
 * Workspaces are not tenant-scoped rows themselves (a workspace is the tenant), so this
 * repository runs outside RLS. Creating one always creates its first owner membership in the
 * same transaction — a workspace without an owner cannot exist (domain rule: last-owner guard).
 * Sign-up-time creation goes through better-auth's organization plugin, which writes the same rows.
 */
export class DrizzleWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: Database) {}

  findById(id: string): Promise<Workspace | null> {
    return withoutTenant(this.db, 'workspace lookup', async (tx) => {
      const [row] = await tx.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
      return row && !row.deletedAt ? toWorkspace(row) : null;
    });
  }

  listByIds(ids: readonly string[]): Promise<Workspace[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return withoutTenant(this.db, 'workspace switcher', async (tx) => {
      const rows = await tx
        .select()
        .from(workspaces)
        .where(inArray(workspaces.id, [...ids]));
      return rows.filter((r) => !r.deletedAt).map(toWorkspace);
    });
  }

  create(w: Workspace, owner: { operatorId: string }): Promise<void> {
    return withoutTenant(this.db, 'workspace creation with first owner', async (tx) => {
      await tx.insert(workspaces).values({
        id: w.id,
        name: w.name,
        slug: w.slug,
        locale: w.locale,
        timezone: w.timezone,
        createdAt: w.createdAt,
        updatedAt: w.createdAt,
      });
      await tx.insert(memberships).values({
        id: ulid(w.createdAt.getTime()),
        workspaceId: w.id,
        operatorId: owner.operatorId,
        role: 'owner',
        invitedBy: null,
        acceptedAt: w.createdAt,
      });
    });
  }
}

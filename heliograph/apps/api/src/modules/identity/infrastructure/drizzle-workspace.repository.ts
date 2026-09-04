import type { Workspace, WorkspaceRepository } from '@heliograph/domain';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../../../db/client.js';
import { withoutTenant } from '../../../db/tenant.js';
import { memberships, workspaces } from './schema.js';

/**
 * Workspaces are not tenant-scoped rows themselves (a workspace is the tenant), so this
 * repository runs outside RLS. Creating one always creates its first owner membership in the
 * same transaction — a workspace without an owner cannot exist (domain rule: last-owner guard).
 */
export class DrizzleWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: Database) {}

  findById(id: string): Promise<Workspace | null> {
    return withoutTenant(this.db, 'workspace lookup', async (tx) => {
      const [row] = await tx.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
      if (!row || row.deletedAt) return null;
      return {
        id: row.id,
        name: row.name,
        locale: row.locale,
        timezone: row.timezone,
        createdAt: row.createdAt,
      };
    });
  }

  create(w: Workspace, owner: { operatorId: string }): Promise<void> {
    return withoutTenant(this.db, 'workspace creation with first owner', async (tx) => {
      await tx.insert(workspaces).values({
        id: w.id,
        name: w.name,
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

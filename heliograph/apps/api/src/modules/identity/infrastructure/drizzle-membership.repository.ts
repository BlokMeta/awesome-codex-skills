import type { MembershipRecord, MembershipRepository, Role } from '@heliograph/domain';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import { withoutTenant, withWorkspace } from '../../../db/tenant.js';
import { memberships } from './schema.js';

type Row = typeof memberships.$inferSelect;

const toRecord = (r: Row): MembershipRecord => ({
  id: r.id,
  workspaceId: r.workspaceId,
  operatorId: r.operatorId,
  role: r.role,
  invitedBy: r.invitedBy,
  acceptedAt: r.acceptedAt,
});

/**
 * Tenant-scoped reads and writes go through `withWorkspace` (RLS on). The one cross-tenant read,
 * `listForOperator`, is what login uses to build the workspace switcher; it runs without a
 * tenant context and is filtered by operator id only.
 */
export class DrizzleMembershipRepository implements MembershipRepository {
  constructor(private readonly db: Database) {}

  listForWorkspace(workspaceId: string): Promise<MembershipRecord[]> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const rows = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.workspaceId, workspaceId));
      return rows.map(toRecord);
    });
  }

  listForOperator(operatorId: string): Promise<MembershipRecord[]> {
    return withoutTenant(this.db, 'login: list workspaces of the operator', async (tx) => {
      const rows = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.operatorId, operatorId));
      return rows.map(toRecord);
    });
  }

  upsert(m: MembershipRecord): Promise<void> {
    return withWorkspace(this.db, m.workspaceId, async (tx) => {
      await tx
        .insert(memberships)
        .values({
          id: m.id,
          workspaceId: m.workspaceId,
          operatorId: m.operatorId,
          role: m.role,
          invitedBy: m.invitedBy,
          acceptedAt: m.acceptedAt,
        })
        .onConflictDoUpdate({
          target: [memberships.operatorId, memberships.workspaceId],
          set: { role: m.role, acceptedAt: m.acceptedAt, updatedAt: new Date() },
        });
    });
  }

  setRole(workspaceId: string, operatorId: string, role: Role): Promise<void> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      await tx
        .update(memberships)
        .set({ role, updatedAt: new Date() })
        .where(
          and(eq(memberships.workspaceId, workspaceId), eq(memberships.operatorId, operatorId)),
        );
    });
  }

  remove(workspaceId: string, operatorId: string): Promise<void> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      await tx
        .delete(memberships)
        .where(
          and(eq(memberships.workspaceId, workspaceId), eq(memberships.operatorId, operatorId)),
        );
    });
  }
}

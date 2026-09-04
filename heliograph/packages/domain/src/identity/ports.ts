import type { Membership, Role } from './membership.js';

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly locale: string;
  readonly timezone: string;
  readonly createdAt: Date;
}

export interface WorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  create(workspace: Workspace, owner: { operatorId: string }): Promise<void>;
}

export interface MembershipRecord extends Membership {
  readonly id: string;
  readonly invitedBy: string | null;
  readonly acceptedAt: Date | null;
}

/**
 * Persistence port for memberships. Every read is scoped: either "who is in this workspace"
 * (used by authorize) or "which workspaces does this operator belong to" (used at login).
 */
export interface MembershipRepository {
  listForWorkspace(workspaceId: string): Promise<MembershipRecord[]>;
  listForOperator(operatorId: string): Promise<MembershipRecord[]>;
  upsert(membership: MembershipRecord): Promise<void>;
  setRole(workspaceId: string, operatorId: string, role: Role): Promise<void>;
  remove(workspaceId: string, operatorId: string): Promise<void>;
}

import { z } from 'zod';
import { type DomainError, domainError } from '../shared/domain-error.js';
import { err, ok, type Result } from '../shared/result.js';

/** Tenant model (ADR-0012): a workspace is the customer; operators join it with a role. */
export const RoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer']);
export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.enum([
  'workspace.read',
  'workspace.settings',
  'workspace.billing',
  'workspace.delete',
  'members.invite',
  'members.remove',
  'persona.manage',
  'channel.connect',
  'channel.disconnect',
  'content.review',
  'content.publish_now',
  'inbox.reply',
  'deals.manage',
  'library.upload',
  'analytics.read',
  'audit.read',
]);
export type Permission = z.infer<typeof PermissionSchema>;

const VIEWER: readonly Permission[] = ['workspace.read', 'analytics.read'];
const EDITOR: readonly Permission[] = [
  ...VIEWER,
  'persona.manage',
  'channel.connect',
  'content.review',
  'content.publish_now',
  'inbox.reply',
  'deals.manage',
  'library.upload',
];
const ADMIN: readonly Permission[] = [
  ...EDITOR,
  'workspace.settings',
  'members.invite',
  'members.remove',
  'channel.disconnect',
  'audit.read',
];
const OWNER: readonly Permission[] = [...ADMIN, 'workspace.billing', 'workspace.delete'];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  viewer: VIEWER,
  editor: EDITOR,
  admin: ADMIN,
  owner: OWNER,
};

export const can = (role: Role, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role].includes(permission);

export interface Membership {
  readonly operatorId: string;
  readonly workspaceId: string;
  readonly role: Role;
}

/**
 * Authorization check used by every application use-case: the actor must be a member of the
 * target workspace AND hold the permission. Cross-tenant access is impossible by construction —
 * the membership list is loaded for the target workspace only.
 */
export function authorize(
  memberships: readonly Membership[],
  actorId: string,
  workspaceId: string,
  permission: Permission,
): Result<Membership, DomainError> {
  const m = memberships.find((x) => x.operatorId === actorId && x.workspaceId === workspaceId);
  if (!m) {
    return err(domainError('identity.not_a_member', 'errors.identity.notAMember'));
  }
  if (!can(m.role, permission)) {
    return err(
      domainError('identity.forbidden', 'errors.identity.forbidden', { permission, role: m.role }),
    );
  }
  return ok(m);
}

const rank: Record<Role, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

/** Admins may assign roles below their own; owners may assign any. Nobody demotes the last owner. */
export function changeRole(
  memberships: readonly Membership[],
  actor: Membership,
  targetOperatorId: string,
  newRole: Role,
): Result<Membership[], DomainError> {
  if (!can(actor.role, 'members.invite')) {
    return err(
      domainError('identity.forbidden', 'errors.identity.forbidden', {
        permission: 'members.invite',
        role: actor.role,
      }),
    );
  }
  if (actor.role !== 'owner' && rank[newRole] >= rank[actor.role]) {
    return err(
      domainError('identity.role_too_high', 'errors.identity.roleTooHigh', { role: newRole }),
    );
  }
  const target = memberships.find(
    (m) => m.operatorId === targetOperatorId && m.workspaceId === actor.workspaceId,
  );
  if (!target) return err(domainError('identity.not_a_member', 'errors.identity.notAMember'));
  const owners = memberships.filter(
    (m) => m.workspaceId === actor.workspaceId && m.role === 'owner',
  );
  if (target.role === 'owner' && newRole !== 'owner' && owners.length === 1) {
    return err(domainError('identity.last_owner', 'errors.identity.lastOwner'));
  }
  return ok(memberships.map((m) => (m === target ? { ...m, role: newRole } : m)));
}

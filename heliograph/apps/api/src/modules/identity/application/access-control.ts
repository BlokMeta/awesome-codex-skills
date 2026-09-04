import { type Permission, PermissionSchema, ROLE_PERMISSIONS, type Role } from '@heliograph/domain';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/organization/access';

/**
 * better-auth access control mirroring the domain permission matrix. Statements are written
 * out (not derived) so the plugin keeps literal types; `access-control.test.ts` proves the two
 * never drift. The organization plugin's own statements are merged so its endpoints
 * (invite, remove member, update org) are governed by the same roles.
 */
export const statements = {
  ...defaultStatements,
  workspace: ['read', 'settings', 'billing', 'delete'],
  members: ['invite', 'remove'],
  persona: ['manage'],
  channel: ['connect', 'disconnect'],
  content: ['review', 'publish_now'],
  inbox: ['reply'],
  deals: ['manage'],
  library: ['upload'],
  analytics: ['read'],
  audit: ['read'],
} as const;

export const ac = createAccessControl(statements);

type Statement = { [K in keyof typeof statements]?: (typeof statements)[K][number][] };

function domainGrants(role: Role): Statement {
  const grants: Record<string, string[]> = {};
  for (const p of ROLE_PERMISSIONS[role]) {
    const [resource, action] = p.split('.') as [string, string];
    const list = grants[resource] ?? [];
    list.push(action);
    grants[resource] = list;
  }
  return grants as Statement;
}

const orgGrants: Record<Role, Statement> = {
  owner: {
    organization: ['update', 'delete'],
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
  },
  admin: {
    organization: ['update'],
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
  },
  editor: {},
  viewer: {},
};

export const roles = {
  owner: ac.newRole({ ...domainGrants('owner'), ...orgGrants.owner }),
  admin: ac.newRole({ ...domainGrants('admin'), ...orgGrants.admin }),
  editor: ac.newRole({ ...domainGrants('editor'), ...orgGrants.editor }),
  viewer: ac.newRole({ ...domainGrants('viewer'), ...orgGrants.viewer }),
};

/** Every domain permission must exist in `statements`; used by the drift test. */
export function missingStatements(): Permission[] {
  return PermissionSchema.options.filter((p) => {
    const [resource, action] = p.split('.') as [string, string];
    const actions = (statements as Record<string, readonly string[]>)[resource];
    return !actions?.includes(action);
  });
}

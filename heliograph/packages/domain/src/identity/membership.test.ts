import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  authorize,
  can,
  changeRole,
  type Membership,
  PermissionSchema,
  ROLE_PERMISSIONS,
  RoleSchema,
} from './membership.js';

const ws = 'WS1';
const members: Membership[] = [
  { operatorId: 'own', workspaceId: ws, role: 'owner' },
  { operatorId: 'adm', workspaceId: ws, role: 'admin' },
  { operatorId: 'edi', workspaceId: ws, role: 'editor' },
  { operatorId: 'vie', workspaceId: ws, role: 'viewer' },
  { operatorId: 'own', workspaceId: 'WS2', role: 'owner' },
];

describe('role permissions', () => {
  it('are strictly nested viewer ⊂ editor ⊂ admin ⊂ owner', () => {
    const roles = ['viewer', 'editor', 'admin', 'owner'] as const;
    expect([...RoleSchema.options].sort()).toEqual([...roles].sort());
    for (let i = 1; i < roles.length; i++) {
      const lower = ROLE_PERMISSIONS[roles[i - 1] as (typeof roles)[number]];
      const higher = ROLE_PERMISSIONS[roles[i] as (typeof roles)[number]];
      for (const p of lower) expect(higher).toContain(p);
      expect(higher.length).toBeGreaterThan(lower.length);
    }
  });

  it('reserves billing and deletion for owners', () => {
    expect(can('admin', 'workspace.billing')).toBe(false);
    expect(can('owner', 'workspace.billing')).toBe(true);
    expect(can('admin', 'workspace.delete')).toBe(false);
  });
});

describe('authorize', () => {
  it('denies non-members and cross-tenant actors', () => {
    expect(authorize(members, 'edi', 'WS2', 'workspace.read')).toMatchObject({
      ok: false,
      error: { code: 'identity.not_a_member' },
    });
    expect(authorize(members, 'ghost', ws, 'workspace.read').ok).toBe(false);
  });

  it('denies members lacking the permission, allows the rest', () => {
    expect(authorize(members, 'vie', ws, 'content.review')).toMatchObject({
      ok: false,
      error: {
        code: 'identity.forbidden',
        params: { permission: 'content.review', role: 'viewer' },
      },
    });
    expect(authorize(members, 'edi', ws, 'content.review').ok).toBe(true);
  });

  it('never grants a permission the role table does not list', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RoleSchema.options),
        fc.constantFrom(...PermissionSchema.options),
        (role, permission) => {
          const r = authorize([{ operatorId: 'a', workspaceId: ws, role }], 'a', ws, permission);
          expect(r.ok).toBe(ROLE_PERMISSIONS[role].includes(permission));
        },
      ),
    );
  });
});

describe('changeRole', () => {
  const admin = members[1] as Membership;
  const owner = members[0] as Membership;

  it('lets admins assign roles below admin only', () => {
    expect(changeRole(members, admin, 'vie', 'editor').ok).toBe(true);
    expect(changeRole(members, admin, 'edi', 'admin')).toMatchObject({
      ok: false,
      error: { code: 'identity.role_too_high' },
    });
  });

  it('lets owners promote to owner and refuses demoting the last owner', () => {
    const r = changeRole(members, owner, 'adm', 'owner');
    expect(r.ok && r.value.filter((m) => m.workspaceId === ws && m.role === 'owner')).toHaveLength(
      2,
    );
    expect(changeRole(members, owner, 'own', 'admin')).toMatchObject({
      ok: false,
      error: { code: 'identity.last_owner' },
    });
  });

  it('rejects editors and unknown targets', () => {
    expect(changeRole(members, members[2] as Membership, 'vie', 'viewer').ok).toBe(false);
    expect(changeRole(members, owner, 'nobody', 'viewer')).toMatchObject({
      ok: false,
      error: { code: 'identity.not_a_member' },
    });
  });
});

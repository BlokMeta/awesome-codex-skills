import { ROLE_PERMISSIONS } from '@heliograph/domain';
import { describe, expect, it } from 'vitest';
import { missingStatements, roles, statements } from './access-control.js';

describe('access control ↔ domain permission matrix', () => {
  it('every domain permission has a statement', () => {
    expect(missingStatements()).toEqual([]);
  });

  it('roles grant exactly the domain permissions plus organization-plugin actions', () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      const granted = roles[role as keyof typeof roles].statements as Record<string, string[]>;
      for (const p of perms) {
        const [resource, action] = p.split('.') as [string, string];
        expect(granted[resource], `${role} ${p}`).toContain(action);
      }
    }
    expect((roles.viewer.statements as Record<string, string[]>)['invitation']).toBeUndefined();
    expect((roles.owner.statements as Record<string, string[]>)['organization']).toEqual([
      'update',
      'delete',
    ]);
    expect(Object.keys(statements)).toContain('workspace');
  });
});

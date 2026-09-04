import { contract } from '@heliograph/contracts';
import type { MembershipRepository, WorkspaceRepository } from '@heliograph/domain';
import { Controller, Inject } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { MEMBERSHIP_REPOSITORY, WORKSPACE_REPOSITORY } from '../../../shared/tokens.js';
import type { SessionContext } from '../infrastructure/auth.js';
import { CurrentSession } from './auth.decorators.js';

@Controller()
export class IdentityController {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(WORKSPACE_REPOSITORY) private readonly workspaces: WorkspaceRepository,
  ) {}

  @Implement(contract.identity.me)
  me(@CurrentSession() session: SessionContext) {
    return implement(contract.identity.me).handler(async () => {
      const { user } = session;
      const mine = await this.memberships.listForOperator(user.id);
      const found = await this.workspaces.listByIds(mine.map((m) => m.workspaceId));
      const byId = new Map(found.map((w) => [w.id, w]));
      return {
        operator: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          locale: user.locale ?? 'tr',
          timezone: user.timezone ?? 'Europe/Istanbul',
          twoFactorEnabled: user.twoFactorEnabled ?? false,
        },
        workspaces: mine.flatMap((m) => {
          const w = byId.get(m.workspaceId);
          return w ? [{ id: w.id, name: w.name, slug: w.slug, role: m.role }] : [];
        }),
        activeWorkspaceId: session.session.activeOrganizationId ?? null,
      };
    });
  }
}

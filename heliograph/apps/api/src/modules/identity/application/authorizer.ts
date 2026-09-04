import {
  authorize,
  type DomainError,
  type Membership,
  type MembershipRepository,
  type Permission,
  type Result,
} from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import { MEMBERSHIP_REPOSITORY } from '../../../shared/tokens.js';

/**
 * Use-case level permission check (docs/08 §2): every application service calls
 * `assert(principalId, workspaceId, permission)` before touching tenant data. Memberships are
 * read under the target workspace's RLS context, so a non-member sees an empty list and fails.
 */
@Injectable()
export class Authorizer {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository) {}

  async assert(
    operatorId: string,
    workspaceId: string,
    permission: Permission,
  ): Promise<Result<Membership, DomainError>> {
    const rows = await this.memberships.listForWorkspace(workspaceId);
    return authorize(rows, operatorId, workspaceId, permission);
  }
}

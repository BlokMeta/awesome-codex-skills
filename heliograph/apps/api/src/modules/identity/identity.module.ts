import { Module } from '@nestjs/common';
import type { Database } from '../../db/client.js';
import { DATABASE, MEMBERSHIP_REPOSITORY, WORKSPACE_REPOSITORY } from '../../shared/tokens.js';
import { DrizzleMembershipRepository } from './infrastructure/drizzle-membership.repository.js';
import { DrizzleWorkspaceRepository } from './infrastructure/drizzle-workspace.repository.js';

@Module({
  providers: [
    {
      provide: MEMBERSHIP_REPOSITORY,
      useFactory: (db: Database) => new DrizzleMembershipRepository(db),
      inject: [DATABASE],
    },
    {
      provide: WORKSPACE_REPOSITORY,
      useFactory: (db: Database) => new DrizzleWorkspaceRepository(db),
      inject: [DATABASE],
    },
  ],
  exports: [MEMBERSHIP_REPOSITORY, WORKSPACE_REPOSITORY],
})
export class IdentityModule {}

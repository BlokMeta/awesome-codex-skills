import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { Database } from '../../db/client.js';
import { ProblemFilter } from '../../shared/http/problem.filter.js';
import {
  AUTH,
  DATABASE,
  EMAIL_SENDER,
  MEMBERSHIP_REPOSITORY,
  WORKSPACE_REPOSITORY,
} from '../../shared/tokens.js';
import { Authorizer } from './application/authorizer.js';
import type { EmailSender } from './application/email-sender.js';
import { createAuth } from './infrastructure/auth.js';
import { type AuthConfig, readAuthConfig } from './infrastructure/auth-env.js';
import { DrizzleMembershipRepository } from './infrastructure/drizzle-membership.repository.js';
import { DrizzleWorkspaceRepository } from './infrastructure/drizzle-workspace.repository.js';
import { LogEmailSender } from './infrastructure/log-email-sender.js';
import { IdentityController } from './interface/identity.controller.js';
import { SessionGuard } from './interface/session.guard.js';

export interface IdentityModuleOptions {
  /** Defaults to the validated process environment. Tests inject explicit values. */
  readonly authConfig?: AuthConfig;
  readonly emailSender?: EmailSender;
}

@Module({})
export class IdentityModule {
  static forRoot(opts: IdentityModuleOptions = {}): DynamicModule {
    return {
      module: IdentityModule,
      global: true,
      controllers: [IdentityController],
      providers: [
        { provide: EMAIL_SENDER, useValue: opts.emailSender ?? new LogEmailSender() },
        {
          provide: AUTH,
          useFactory: (db: Database, email: EmailSender) =>
            createAuth({ db, email, config: opts.authConfig ?? readAuthConfig() }),
          inject: [DATABASE, EMAIL_SENDER],
        },
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
        Authorizer,
        { provide: APP_GUARD, useClass: SessionGuard },
        { provide: APP_FILTER, useClass: ProblemFilter },
      ],
      exports: [AUTH, EMAIL_SENDER, MEMBERSHIP_REPOSITORY, WORKSPACE_REPOSITORY, Authorizer],
    };
  }
}

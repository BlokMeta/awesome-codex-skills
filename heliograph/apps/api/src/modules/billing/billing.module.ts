import { Module } from '@nestjs/common';
import type { Database } from '../../db/client.js';
import {
  CREDIT_LEDGER_REPOSITORY,
  DATABASE,
  PLAN_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  USAGE_REPOSITORY,
} from '../../shared/tokens.js';
import { ConfigModule } from '../config/config.module.js';
import { EntitlementService } from './application/entitlement.service.js';
import {
  DrizzleCreditLedgerRepository,
  DrizzlePlanRepository,
  DrizzleSubscriptionRepository,
  DrizzleUsageRepository,
} from './infrastructure/drizzle-billing.repositories.js';
import { BillingController } from './interface/billing.controller.js';

const repo = <T>(token: symbol, make: (db: Database) => T) => ({
  provide: token,
  useFactory: make,
  inject: [DATABASE],
});

@Module({
  imports: [ConfigModule],
  controllers: [BillingController],
  providers: [
    repo(PLAN_REPOSITORY, (db) => new DrizzlePlanRepository(db)),
    repo(SUBSCRIPTION_REPOSITORY, (db) => new DrizzleSubscriptionRepository(db)),
    repo(USAGE_REPOSITORY, (db) => new DrizzleUsageRepository(db)),
    repo(CREDIT_LEDGER_REPOSITORY, (db) => new DrizzleCreditLedgerRepository(db)),
    EntitlementService,
  ],
  exports: [EntitlementService, USAGE_REPOSITORY, CREDIT_LEDGER_REPOSITORY, PLAN_REPOSITORY],
})
export class BillingModule {}

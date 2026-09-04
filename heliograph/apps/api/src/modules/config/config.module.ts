import { type Clock, systemClock } from '@heliograph/domain';
import { Module } from '@nestjs/common';
import type { Database } from '../../db/client.js';
import {
  CLOCK,
  CONFIG_READER,
  CONFIG_SERVICE,
  DATABASE,
  POLICY_REPOSITORY,
  STALE_ALERT_SINK,
} from '../../shared/tokens.js';
import { ConfigService } from './application/config.service.js';
import { StalenessWatcher } from './application/staleness-watcher.js';
import { DrizzlePolicyRepository } from './infrastructure/drizzle-policy.repository.js';
import { LogAlertSink } from './infrastructure/log-alert-sink.js';

@Module({
  providers: [
    { provide: CLOCK, useValue: systemClock },
    {
      provide: POLICY_REPOSITORY,
      useFactory: (db: Database) => new DrizzlePolicyRepository(db),
      inject: [DATABASE],
    },
    {
      provide: ConfigService,
      useFactory: (repo: DrizzlePolicyRepository, clock: Clock) => new ConfigService(repo, clock),
      inject: [POLICY_REPOSITORY, CLOCK],
    },
    { provide: CONFIG_READER, useExisting: ConfigService },
    { provide: CONFIG_SERVICE, useExisting: ConfigService },
    { provide: STALE_ALERT_SINK, useClass: LogAlertSink },
    StalenessWatcher,
  ],
  exports: [ConfigService, CONFIG_READER, CONFIG_SERVICE, CLOCK, POLICY_REPOSITORY],
})
export class ConfigModule {}

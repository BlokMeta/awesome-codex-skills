import { systemClock } from '@heliograph/domain';
import { Module } from '@nestjs/common';
import { CLOCK, CONFIG_READER, CONFIG_SERVICE, POLICY_REPOSITORY } from '../../shared/tokens.js';
import { ConfigService } from './application/config.service.js';
import { InMemoryPolicyRepository } from './infrastructure/in-memory-policy.repository.js';
import { seedEntries } from './infrastructure/seed.js';

@Module({
  providers: [
    { provide: CLOCK, useValue: systemClock },
    {
      provide: POLICY_REPOSITORY,
      useFactory: () => new InMemoryPolicyRepository(seedEntries(new Date())),
    },
    {
      provide: ConfigService,
      useFactory: (repo: InMemoryPolicyRepository, clock: typeof systemClock) =>
        new ConfigService(repo, clock),
      inject: [POLICY_REPOSITORY, CLOCK],
    },
    { provide: CONFIG_READER, useExisting: ConfigService },
    { provide: CONFIG_SERVICE, useExisting: ConfigService },
  ],
  exports: [ConfigService, CONFIG_READER, CONFIG_SERVICE, CLOCK, POLICY_REPOSITORY],
})
export class ConfigModule {}

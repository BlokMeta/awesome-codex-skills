import { Module } from '@nestjs/common';
import type { Database } from '../../db/client.js';
import { CONSENT_REPOSITORY, DATABASE } from '../../shared/tokens.js';
import { ConfigModule } from '../config/config.module.js';
import { ConsentService } from './application/consent.service.js';
import { DrizzleConsentRepository } from './infrastructure/drizzle-consent.repository.js';
import { PrivacyController } from './interface/privacy.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [PrivacyController],
  providers: [
    {
      provide: CONSENT_REPOSITORY,
      useFactory: (db: Database) => new DrizzleConsentRepository(db),
      inject: [DATABASE],
    },
    ConsentService,
  ],
  exports: [ConsentService],
})
export class PrivacyModule {}

import { Module } from '@nestjs/common';
import type { Database } from '../../db/client.js';
import { DATABASE, PERSONA_REPOSITORY } from '../../shared/tokens.js';
import { BillingModule } from '../billing/billing.module.js';
import { ConfigModule } from '../config/config.module.js';
import { PersonaService } from './application/persona.service.js';
import { DrizzlePersonaRepository } from './infrastructure/drizzle-persona.repository.js';
import { PersonaController } from './interface/persona.controller.js';

@Module({
  imports: [ConfigModule, BillingModule],
  controllers: [PersonaController],
  providers: [
    {
      provide: PERSONA_REPOSITORY,
      useFactory: (db: Database) => new DrizzlePersonaRepository(db),
      inject: [DATABASE],
    },
    PersonaService,
  ],
  exports: [PersonaService],
})
export class PersonaModule {}

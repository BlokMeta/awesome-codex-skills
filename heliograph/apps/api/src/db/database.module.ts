import { type DynamicModule, Module } from '@nestjs/common';
import { DATABASE } from '../shared/tokens.js';
import type { Database } from './client.js';

/** Global provider for the Drizzle handle; the concrete driver is chosen by bootstrap. */
@Module({})
export class DatabaseModule {
  static forRoot(db: Database): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [{ provide: DATABASE, useValue: db }],
      exports: [DATABASE],
    };
  }
}

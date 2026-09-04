import { type DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { ulid } from 'ulid';
import type { Database } from './db/client.js';
import { DatabaseModule } from './db/database.module.js';
import { IdentityModule, type IdentityModuleOptions } from './modules/identity/identity.module.js';
import { SystemModule } from './modules/system/system.module.js';

export interface AppOptions {
  readonly db: Database;
  /** Cron jobs (staleness watcher) are off in tests and one-off CLIs. */
  readonly schedule?: boolean;
  readonly identity?: IdentityModuleOptions;
}

@Module({})
export class AppModule {
  static forRoot(opts: AppOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: process.env['HG_LOG_LEVEL'] ?? 'info',
            genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? ulid(),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                '*.token',
                '*.accessToken',
                '*.apiKey',
              ],
              censor: '[redacted]',
            },
            quietReqLogger: true,
          },
        }),
        DatabaseModule.forRoot(opts.db),
        ...(opts.schedule ? [ScheduleModule.forRoot()] : []),
        IdentityModule.forRoot(opts.identity ?? {}),
        SystemModule,
      ],
    };
  }
}

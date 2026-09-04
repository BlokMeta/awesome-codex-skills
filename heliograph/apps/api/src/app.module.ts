import { type DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { trace } from '@opentelemetry/api';
import { ORPCModule } from '@orpc/nest';
import type { FastifyPluginCallback } from 'fastify';
import { LoggerModule } from 'nestjs-pino';
import { ulid } from 'ulid';
import type { Database } from './db/client.js';
import { DatabaseModule } from './db/database.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { IdentityModule, type IdentityModuleOptions } from './modules/identity/identity.module.js';
import { PrivacyModule } from './modules/privacy/privacy.module.js';
import { SystemModule } from './modules/system/system.module.js';
import { orpcProblemInterceptor } from './shared/http/orpc-problem.js';

export interface AppOptions {
  readonly db: Database;
  /** Cron jobs (staleness watcher) are off in tests and one-off CLIs. */
  readonly schedule?: boolean;
  readonly identity?: IdentityModuleOptions;
  /** Fastify OpenTelemetry plugin from startTelemetry(); null when telemetry is off. */
  readonly fastifyOtelPlugin?: FastifyPluginCallback | null;
  /** Allowed browser origins (web app URL); empty in tests and CLIs. */
  readonly corsOrigins?: string[];
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
            // Correlate every log line with the active trace (docs/09 §1).
            mixin: () => {
              const ctx = trace.getActiveSpan()?.spanContext();
              return ctx ? { traceId: ctx.traceId, spanId: ctx.spanId } : {};
            },
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
        ORPCModule.forRoot({ sendResponseInterceptors: [orpcProblemInterceptor] }),
        DatabaseModule.forRoot(opts.db),
        ...(opts.schedule ? [ScheduleModule.forRoot()] : []),
        IdentityModule.forRoot(opts.identity ?? {}),
        SystemModule,
        BillingModule,
        PrivacyModule,
      ],
    };
  }
}

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ulid } from 'ulid';
import { SystemModule } from './modules/system/system.module.js';

@Module({
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
    SystemModule,
  ],
})
export class AppModule {}

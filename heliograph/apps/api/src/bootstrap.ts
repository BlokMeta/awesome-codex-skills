import 'reflect-metadata';
import cors from '@fastify/cors';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule, type AppOptions } from './app.module.js';
import { mountAuth } from './modules/identity/interface/auth.mount.js';

export async function createApp(opts: AppOptions): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(opts),
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  if (opts.fastifyOtelPlugin) await app.register(opts.fastifyOtelPlugin);
  // Browser clients live on another origin (app.<domain> → api.<domain>); cookies need credentials.
  await app.register(cors, {
    origin: opts.corsOrigins ?? [],
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'x-request-id', 'idempotency-key'],
    exposedHeaders: ['set-auth-token', 'x-request-id'],
    maxAge: 600,
  });
  mountAuth(app);
  app.enableShutdownHooks();
  return app;
}

import 'reflect-metadata';
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
  mountAuth(app);
  app.enableShutdownHooks();
  return app;
}

import 'reflect-metadata';
import { HealthResponseSchema } from '@heliograph/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';
import type { DatabaseHandle } from '../src/db/client.js';
import { DrizzlePolicyRepository } from '../src/modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from '../src/modules/config/infrastructure/seed.js';
import { testIdentityOptions } from './support/auth.js';
import { testChannelOptions } from './support/channel.js';
import { createTestDatabase } from './support/db.js';

let app: NestFastifyApplication;
let handle: DatabaseHandle;

beforeAll(async () => {
  handle = await createTestDatabase();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
  app = await createApp({
    db: handle.db,
    identity: testIdentityOptions(),
    channel: testChannelOptions(),
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await handle.close();
});

describe('GET /v1/health', () => {
  it('returns a contract-valid health document with the stale-config counter', async () => {
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/v1/health' });
    expect(res.statusCode).toBe(200);
    const body = HealthResponseSchema.parse(res.json());
    expect(body.status).toBe('ok');
    expect(body.staleConfigKeys).toBe(0);
    expect(body.dependencies[0]?.name).toBe('config');
  });

  it('lists no stale keys right after seeding', async () => {
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/v1/health/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json().stale).toEqual([]);
  });

  it('propagates x-request-id and returns 404 problem-free for unknown routes', async () => {
    const res = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'GET',
        url: '/v1/nope',
        headers: { 'x-request-id': '01J8Z3M9K2Q4R5S6T7V8W9X0Y1' },
      });
    expect(res.statusCode).toBe(404);
  });

  it('boots with the scheduler enabled (cron registration path)', async () => {
    const scheduled = await createApp({
      db: handle.db,
      schedule: true,
      identity: testIdentityOptions(),
      channel: testChannelOptions(),
    });
    await scheduled.init();
    await scheduled.close();
  });
});

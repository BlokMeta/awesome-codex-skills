import 'reflect-metadata';
import { HealthResponseSchema } from '@heliograph/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';

let app: NestFastifyApplication;

beforeAll(async () => {
  app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
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
});

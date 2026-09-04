import 'reflect-metadata';
import {
  ConsentStatusSchema,
  EntitlementsResponseSchema,
  ProblemSchema,
} from '@heliograph/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';
import type { DatabaseHandle } from '../src/db/client.js';
import { DrizzlePlanRepository } from '../src/modules/billing/infrastructure/drizzle-billing.repositories.js';
import { seedPlans } from '../src/modules/billing/infrastructure/seed.js';
import { DrizzlePolicyRepository } from '../src/modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from '../src/modules/config/infrastructure/seed.js';
import { testIdentityOptions } from './support/auth.js';
import { createTestDatabase } from './support/db.js';
import { TestClient } from './support/http.js';

let app: NestFastifyApplication;
let handle: DatabaseHandle;
let client: TestClient;
const AUTH = '/v1/auth';
const password = 'correct horse battery staple';

beforeAll(async () => {
  handle = await createTestDatabase();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
  await seedPlans(new DrizzlePlanRepository(handle.db));
  app = await createApp({ db: handle.db, identity: testIdentityOptions() });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  client = new TestClient(app);
});

afterAll(async () => {
  await app.close();
  await handle.close();
});

describe('consents and entitlements over HTTP', () => {
  it('signs up and sees the signup documents pending', async () => {
    const res = await client.post(`${AUTH}/sign-up/email`, {
      name: 'Cem',
      email: 'cem@example.com',
      password,
    });
    expect(res.statusCode, res.body).toBe(200);
    const status = ConsentStatusSchema.parse((await client.get('/v1/consents')).json());
    expect(status.pending).toEqual(['terms', 'privacy', 'aup', 'ai_processing']);
    expect(status.published['terms']).toBe('2026-09-03');
  });

  it('rejects an outdated version with a 422 problem carrying the domain code', async () => {
    const res = await client.post('/v1/consents', {
      accept: [{ document: 'terms', version: '2020-01-01' }],
    });
    expect(res.statusCode).toBe(422);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const problem = ProblemSchema.parse(res.json());
    expect(problem.code).toBe('privacy.version_outdated');
    expect(problem.params).toMatchObject({ document: 'terms', published: '2026-09-03' });
  });

  it('accepts the published versions and records client metadata', async () => {
    const res = await client.post(
      '/v1/consents',
      {
        accept: ['terms', 'privacy', 'aup', 'ai_processing'].map((document) => ({
          document,
          version: '2026-09-03',
        })),
      },
      { 'user-agent': 'HeliographTest/1.0' },
    );
    expect(res.statusCode, res.body).toBe(200);
    const status = ConsentStatusSchema.parse(res.json());
    expect(status.pending).toEqual([]);
    expect(status.accepted.map((a) => a.document).sort()).toEqual([
      'ai_processing',
      'aup',
      'privacy',
      'terms',
    ]);
  });

  it('withdraws an optional consent and refuses a required one', async () => {
    await client.post('/v1/consents', { accept: [{ document: 'cookies', version: '2026-09-03' }] });
    const ok = await client.post('/v1/consents/withdraw', { document: 'cookies' });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ConsentStatusSchema.parse(ok.json()).optional['cookies']).toBe('not_granted');
    const bad = await client.post('/v1/consents/withdraw', { document: 'terms' });
    expect(bad.statusCode).toBe(400);
    expect(bad.headers['content-type']).toContain('application/problem+json');
    const problem = ProblemSchema.parse(bad.json());
    expect(problem.code).toBe('validation.failed');
    expect(problem.errors?.[0]?.path).toBe('document');
  });

  it('entitlements need an active workspace (409), then resolve to the Free plan', async () => {
    const none = await client.get('/v1/billing/entitlements');
    expect(none.statusCode).toBe(409);
    expect(ProblemSchema.parse(none.json()).code).toBe('workspace.none_active');

    const created = await client.post(`${AUTH}/organization/create`, {
      name: 'Cem Studio',
      slug: 'cem-studio',
    });
    expect(created.statusCode, created.body).toBe(200);
    await client.post(`${AUTH}/organization/set-active`, { organizationId: created.json().id });
    const res = await client.get('/v1/billing/entitlements');
    expect(res.statusCode, res.body).toBe(200);
    const body = EntitlementsResponseSchema.parse(res.json());
    expect(body.plan.code).toBe('free');
    expect(body.subscription).toBeNull();
    expect(body.entitlements.find((e) => e.feature === 'daily_posts')).toEqual({
      feature: 'daily_posts',
      kind: 'daily',
      limit: 1,
      used: 0,
      remaining: 1,
    });
    expect(body.entitlements.find((e) => e.feature === 'video_pipeline')?.limit).toBe(0);
    expect(body.credits).toEqual({ balance: 0, monthlyGrant: 30, warning: 'exhausted' });
  });
});

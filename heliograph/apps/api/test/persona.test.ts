import 'reflect-metadata';
import { PersonaDtoSchema, ProblemSchema } from '@heliograph/contracts';
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
const AUTH = '/v1/auth';
const password = 'correct horse battery staple';

async function operatorWithWorkspace(email: string, slug: string): Promise<TestClient> {
  const c = new TestClient(app);
  const up = await c.post(`${AUTH}/sign-up/email`, { name: email.split('@')[0], email, password });
  expect(up.statusCode, up.body).toBe(200);
  const ws = await c.post(`${AUTH}/organization/create`, { name: slug, slug });
  expect(ws.statusCode, ws.body).toBe(200);
  await c.post(`${AUTH}/organization/set-active`, { organizationId: ws.json().id });
  return c;
}

beforeAll(async () => {
  handle = await createTestDatabase();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
  await seedPlans(new DrizzlePlanRepository(handle.db));
  app = await createApp({ db: handle.db, identity: testIdentityOptions() });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await handle.close();
});

describe('personas over HTTP', () => {
  let owner: TestClient;
  let personaId: string;

  it('creates a draft persona (201) and lists it with cursor pagination', async () => {
    owner = await operatorWithWorkspace('deniz@example.com', 'deniz-studio');
    const created = await owner.post('/v1/personas', {
      name: 'Deniz Işık',
      niche: 'devops',
      language: 'tr',
      timezone: 'Europe/Istanbul',
    });
    expect(created.statusCode, created.body).toBe(201);
    const dto = PersonaDtoSchema.parse(created.json());
    personaId = dto.id;
    expect(dto.slug).toBe('deniz-isik');
    expect(dto.status).toBe('draft');
    expect(dto.missingForStart).toEqual([
      'voiceBible.summary',
      'voiceBible.tone',
      'topicProfile.include',
    ]);

    const list = await owner.get('/v1/personas?limit=1');
    expect(list.statusCode, list.body).toBe(200);
    expect(list.json().data.length).toBe(1);
    expect(list.json().page).toMatchObject({ hasMore: false, nextCursor: null, limit: 1 });
    expect(list.json().meta.requestId).toBeTruthy();
    const badCursor = await owner.get('/v1/personas?cursor=zzz');
    expect(badCursor.statusCode).toBe(400);
    expect(ProblemSchema.parse(badCursor.json()).code).toBe('pagination.invalid_cursor');
  });

  it('enforces the Free plan persona limit (1) with a 429 problem', async () => {
    const second = await owner.post('/v1/personas', {
      name: 'İkinci',
      niche: 'ai',
      language: 'tr',
      timezone: 'Europe/Istanbul',
    });
    expect(second.statusCode).toBe(429);
    expect(ProblemSchema.parse(second.json()).code).toBe('billing.entitlement_exceeded');
  });

  it('refuses to start an incomplete persona, then starts it after the voice bible step', async () => {
    const early = await owner.post(`/v1/personas/${personaId}/activate`);
    expect(early.statusCode).toBe(422);
    expect(ProblemSchema.parse(early.json()).code).toBe('persona.incomplete');

    const patched = await owner.call('PATCH', `/v1/personas/${personaId}`, {
      voiceBible: {
        summary:
          'Platform mühendisi; Kubernetes ve CI/CD üzerine somut, kısa deneyim notları paylaşır.',
        tone: ['dry', 'concrete'],
        samplePosts: ['helm upgrade --atomic hayat kurtarır.'],
      },
      topicProfile: { include: ['kubernetes', 'ci-cd'] },
      reason: 'wizard: voice',
    });
    expect(patched.statusCode, patched.body).toBe(200);
    const dto = PersonaDtoSchema.parse(patched.json());
    expect(dto.voiceBible.tone).toEqual(['dry', 'concrete']);
    expect(dto.voiceBible.emojiQuota).toEqual({ min: 0, max: 2 });
    expect(dto.missingForStart).toEqual([]);

    const started = await owner.post(`/v1/personas/${personaId}/activate`);
    expect(started.statusCode, started.body).toBe(200);
    expect(PersonaDtoSchema.parse(started.json())).toMatchObject({ status: 'warming' });
    const paused = await owner.post(`/v1/personas/${personaId}/pause`);
    expect(PersonaDtoSchema.parse(paused.json()).status).toBe('paused');
  });

  it("rejects invalid input with field errors and hides other workspaces' personas", async () => {
    const invalid = await owner.call('PATCH', `/v1/personas/${personaId}`, {
      visualKit: { palette: { primary: 'red', accent: '#000000', ground: '#ffffff' } },
    });
    expect(invalid.statusCode).toBe(400);
    expect(ProblemSchema.parse(invalid.json()).errors?.[0]?.path).toContain('visualKit');

    const stranger = await operatorWithWorkspace('bora@example.com', 'bora-studio');
    const notFound = await stranger.get(`/v1/personas/${personaId}`);
    expect(notFound.statusCode).toBe(422);
    expect(ProblemSchema.parse(notFound.json()).code).toBe('persona.not_found');
    expect((await stranger.get('/v1/personas')).json().data).toEqual([]);
  });
});

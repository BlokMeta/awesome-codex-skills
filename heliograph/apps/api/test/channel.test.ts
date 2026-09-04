import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { ChannelDtoSchema, ProblemSchema } from '@heliograph/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';
import type { DatabaseHandle } from '../src/db/client.js';
import { DrizzlePlanRepository } from '../src/modules/billing/infrastructure/drizzle-billing.repositories.js';
import { seedPlans } from '../src/modules/billing/infrastructure/seed.js';
import { ChannelService } from '../src/modules/channel/application/channel.service.js';
import { DrizzleOAuthStateRepository } from '../src/modules/channel/infrastructure/drizzle-oauth-state.repository.js';
import { MasterKeyWrapper } from '../src/modules/channel/infrastructure/envelope.js';
import type { HttpFetch } from '../src/modules/channel/infrastructure/oauth/http.js';
import { DrizzlePolicyRepository } from '../src/modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from '../src/modules/config/infrastructure/seed.js';
import { testIdentityOptions } from './support/auth.js';
import { createTestDatabase, rowsOf } from './support/db.js';
import { TestClient } from './support/http.js';

let app: NestFastifyApplication;
let handle: DatabaseHandle;
const AUTH = '/v1/auth';
const password = 'correct horse battery staple';
const BOT_TOKEN = '123456789:AAHfiqksKZ8WmR2zSjiQ7_v4TW3MbHhWyoQ';
const OTHER_BOT_TOKEN = '987654321:AAHfiqksKZ8WmR2zSjiQ7_v4TW3MbHhWyoZ';

/** Every outbound provider call the tests exercise, keyed by method + URL prefix. */
const seen: Call[] = [];
const state = { xAccessToken: 'x-access-1', xRevoked: false };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

type Call = { url: string; body: string; headers: Record<string, string> };

/** X: OAuth 2.0 + PKCE, confidential client → Basic auth on the token endpoint. */
function xRoutes(call: Call): Response | null {
  const { url, body, headers } = call;
  if (url.startsWith('https://api.x.com/2/oauth2/token')) {
    const params = new URLSearchParams(body);
    if (!headers['authorization']?.startsWith('Basic ')) {
      return json(401, { error: 'unauthorized_client' });
    }
    if (params.get('grant_type') === 'refresh_token') {
      state.xAccessToken = 'x-access-2';
      return json(200, {
        access_token: 'x-access-2',
        refresh_token: 'x-refresh-2',
        expires_in: 7200,
        scope: 'tweet.read users.read offline.access',
      });
    }
    if (params.get('code') !== 'good-code' || !params.get('code_verifier')) {
      return json(400, { error: 'invalid_grant' });
    }
    return json(200, {
      access_token: 'x-access-1',
      refresh_token: 'x-refresh-1',
      expires_in: 7200,
      scope: 'tweet.read users.read offline.access',
    });
  }
  if (url.startsWith('https://api.x.com/2/users/me')) {
    if (state.xRevoked || headers['authorization'] !== `Bearer ${state.xAccessToken}`) {
      return json(401, { title: 'Unauthorized' });
    }
    return json(200, { data: { id: '4242', username: 'deniz_x', name: 'Deniz' } });
  }
  return null;
}

/** Instagram (Business Login): short-lived code exchange → long-lived token. */
function instagramRoutes({ url }: Call): Response | null {
  if (url.startsWith('https://api.instagram.com/oauth/access_token')) {
    return json(200, { access_token: 'ig-short', user_id: '9001' });
  }
  if (url.startsWith('https://graph.instagram.com/access_token')) {
    expect(new URL(url).searchParams.get('grant_type')).toBe('ig_exchange_token');
    return json(200, { access_token: 'ig-long', token_type: 'bearer', expires_in: 5_184_000 });
  }
  if (url.startsWith('https://graph.instagram.com/v21.0/me')) {
    return json(200, { id: '9001', username: 'deniz.ig', name: 'Deniz IG' });
  }
  return null;
}

/** Telegram Bot API getMe. */
function telegramRoutes({ url }: Call): Response | null {
  const tg = /^https:\/\/api\.telegram\.org\/bot([^/]+)\/getMe$/.exec(url);
  if (!tg) return null;
  const bots: Record<string, unknown> = {
    [BOT_TOKEN]: {
      id: 123456789,
      is_bot: true,
      first_name: 'Heliograph Bot',
      username: 'heliograph_bot',
    },
    [OTHER_BOT_TOKEN]: { id: 987654321, is_bot: true, first_name: 'Other', username: 'other_bot' },
  };
  const result = bots[tg[1] ?? ''];
  return result
    ? json(200, { ok: true, result })
    : json(401, { ok: false, error_code: 401, description: 'Unauthorized' });
}

const fakeFetch: HttpFetch = async (url, init) => {
  const headers = Object.fromEntries(
    Object.entries((init?.headers as Record<string, string> | undefined) ?? {}).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ]),
  );
  const call: Call = { url, body: String(init?.body ?? ''), headers };
  seen.push(call);
  return (
    xRoutes(call) ??
    instagramRoutes(call) ??
    telegramRoutes(call) ??
    json(404, { error: `unexpected ${url}` })
  );
};

async function operatorWithWorkspace(email: string, slug: string): Promise<TestClient> {
  const c = new TestClient(app);
  const up = await c.post(`${AUTH}/sign-up/email`, { name: email.split('@')[0], email, password });
  expect(up.statusCode, up.body).toBe(200);
  const ws = await c.post(`${AUTH}/organization/create`, { name: slug, slug });
  expect(ws.statusCode, ws.body).toBe(200);
  await c.post(`${AUTH}/organization/set-active`, { organizationId: ws.json().id });
  return c;
}

const problemCode = (res: { json(): unknown }) => ProblemSchema.parse(res.json()).code;

beforeAll(async () => {
  handle = await createTestDatabase();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
  await seedPlans(new DrizzlePlanRepository(handle.db));
  app = await createApp({
    db: handle.db,
    identity: testIdentityOptions(),
    channel: {
      urls: { apiUrl: 'http://localhost:4000', webUrl: 'http://localhost:3000' },
      keyWrapper: new MasterKeyWrapper(randomBytes(32).toString('base64')),
      fetch: fakeFetch,
      env: {
        HG_X_CLIENT_ID: 'x-client',
        HG_X_CLIENT_SECRET: 'x-secret',
        HG_META_APP_ID: 'meta-app',
        HG_META_APP_SECRET: 'meta-secret',
      },
    },
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await handle.close();
});

describe('channels over HTTP', () => {
  let owner: TestClient;
  let xChannelId: string;
  let telegramChannelId: string;

  it('lists only the platforms whose client credentials are configured (+ Telegram)', async () => {
    owner = await operatorWithWorkspace('deniz@example.com', 'deniz-studio');
    const res = await owner.get('/v1/channels/platforms');
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json().available.sort()).toEqual(['instagram', 'telegram', 'x']);
    const start = await owner.post('/v1/channels/oauth/tiktok/start', {});
    expect(start.statusCode).toBe(503);
    expect(problemCode(start)).toBe('channel.provider_not_configured');
  });

  it('runs the X flow: PKCE start → provider callback → connected channel', async () => {
    const start = await owner.post('/v1/channels/oauth/x/start', {});
    expect(start.statusCode, start.body).toBe(200);
    const url = new URL(start.json().url);
    expect(url.origin + url.pathname).toBe('https://x.com/i/oauth2/authorize');
    expect(url.searchParams.get('client_id')).toBe('x-client');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/v1/channels/oauth/x/callback',
    );
    expect(url.searchParams.get('scope')).toContain('offline.access');
    const oauthState = url.searchParams.get('state');
    expect(oauthState).toBe(start.json().state);

    // The callback has no session: a browser fresh from x.com hits it.
    const anonymous = new TestClient(app);
    const bad = await anonymous.get(
      `/v1/channels/oauth/x/callback?code=good-code&state=not-a-state`,
    );
    expect(bad.statusCode).toBe(302);
    expect(new URL(bad.headers['location'] as string).searchParams.get('error')).toBe(
      'channel.oauth_state_invalid',
    );

    const done = await anonymous.get(
      `/v1/channels/oauth/x/callback?code=good-code&state=${oauthState}`,
    );
    expect(done.statusCode, done.body).toBe(302);
    const target = new URL(done.headers['location'] as string);
    expect(target.origin + target.pathname).toBe('http://localhost:3000/channels');
    xChannelId = target.searchParams.get('connected') ?? '';
    expect(xChannelId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

    // The token request carried the verifier and Basic auth, never the secret in the body.
    const tokenCall = seen.find((s) => s.url.startsWith('https://api.x.com/2/oauth2/token'));
    expect(tokenCall?.body).toContain('code_verifier=');
    expect(tokenCall?.body).not.toContain('client_secret');

    // Replaying the callback fails: the state was consumed.
    const replay = await anonymous.get(
      `/v1/channels/oauth/x/callback?code=good-code&state=${oauthState}`,
    );
    expect(new URL(replay.headers['location'] as string).searchParams.get('error')).toBe(
      'channel.oauth_state_invalid',
    );

    const got = await owner.get(`/v1/channels/${xChannelId}`);
    expect(got.statusCode, got.body).toBe(200);
    const dto = ChannelDtoSchema.parse(got.json());
    expect(dto).toMatchObject({
      platform: 'x',
      handle: 'deniz_x',
      externalAccountId: '4242',
      health: 'ok',
      personaId: null,
    });
    expect(dto.scopes).toEqual(['tweet.read', 'users.read', 'offline.access']);
    expect(dto.capabilities.publish).toContain('text');
    expect(new Date(dto.tokenExpiresAt ?? 0).getTime()).toBeGreaterThan(Date.now() + 3_600_000);
  });

  it('reports a denied consent from the provider without touching the workspace', async () => {
    const start = await owner.post('/v1/channels/oauth/instagram/start', {});
    expect(start.statusCode, start.body).toBe(200);
    const st = start.json().state as string;
    const res = await new TestClient(app).get(
      `/v1/channels/oauth/instagram/callback?error=access_denied&state=${st}`,
    );
    const target = new URL(res.headers['location'] as string);
    expect(target.searchParams.get('error')).toBe('channel.oauth_denied');
    expect(target.searchParams.get('platform')).toBe('instagram');
  });

  it('connects a Telegram bot with getMe and rejects a bad token', async () => {
    const bad = await owner.post('/v1/channels/telegram', {
      botToken: '111111:definitely-not-a-real-bot-token',
    });
    expect(bad.statusCode, bad.body).toBe(502);
    expect(problemCode(bad)).toBe('channel.provider_rejected');

    const res = await owner.post('/v1/channels/telegram', { botToken: BOT_TOKEN });
    expect(res.statusCode, res.body).toBe(201);
    const dto = ChannelDtoSchema.parse(res.json());
    telegramChannelId = dto.id;
    expect(dto).toMatchObject({
      platform: 'telegram',
      handle: 'heliograph_bot',
      displayName: 'Heliograph Bot',
      tokenExpiresAt: null,
    });

    // Reconnecting the same bot updates in place instead of creating a duplicate.
    const again = await owner.post('/v1/channels/telegram', { botToken: BOT_TOKEN });
    expect(again.statusCode, again.body).toBe(201);
    expect(again.json().id).toBe(telegramChannelId);
    const list = await owner.get('/v1/channels?limit=10');
    expect(list.json().data).toHaveLength(2);
  });

  it('never stores plaintext secrets', async () => {
    const rows = rowsOf<{ ciphertext: Uint8Array | string }>(
      await handle.db.execute(sql`select ciphertext from credentials`),
    );
    expect(rows.length).toBe(2);
    for (const r of rows) {
      const hex =
        typeof r.ciphertext === 'string' ? r.ciphertext : Buffer.from(r.ciphertext).toString('hex');
      expect(hex).not.toContain(Buffer.from(BOT_TOKEN).toString('hex'));
      expect(hex).not.toContain(Buffer.from('x-access-1').toString('hex'));
    }
  });

  it('enforces the Free plan connected_accounts limit (2) with 429', async () => {
    const res = await owner.post('/v1/channels/oauth/instagram/start', {});
    expect(res.statusCode, res.body).toBe(429);
    expect(problemCode(res)).toBe('billing.entitlement_exceeded');
    const tg = await owner.post('/v1/channels/telegram', { botToken: OTHER_BOT_TOKEN });
    expect(tg.statusCode).toBe(429);
  });

  it('refuses an account already connected in another workspace', async () => {
    const other = await operatorWithWorkspace('ekin@example.com', 'ekin-media');
    const res = await other.post('/v1/channels/telegram', { botToken: BOT_TOKEN });
    expect(res.statusCode, res.body).toBe(422);
    expect(problemCode(res)).toBe('channel.connected_elsewhere');
    // Tenant isolation: the other workspace sees nothing of ours.
    const list = await other.get('/v1/channels?limit=10');
    expect(list.json().data).toEqual([]);
    const get = await other.get(`/v1/channels/${xChannelId}`);
    expect(get.statusCode).toBe(422);
    expect(problemCode(get)).toBe('channel.not_found');
  });

  it('assigns a channel to a persona and validates the persona', async () => {
    const persona = await owner.post('/v1/personas', {
      name: 'Deniz',
      niche: 'devops',
      language: 'tr',
      timezone: 'Europe/Istanbul',
    });
    expect(persona.statusCode, persona.body).toBe(201);
    const ok = await owner.call('PATCH', `/v1/channels/${xChannelId}`, {
      personaId: persona.json().id,
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().personaId).toBe(persona.json().id);
    const filtered = await owner.get(`/v1/channels?limit=10&personaId=${persona.json().id}`);
    expect(filtered.json().data.map((c: { id: string }) => c.id)).toEqual([xChannelId]);
    const missing = await owner.call('PATCH', `/v1/channels/${xChannelId}`, {
      personaId: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
    });
    expect(missing.statusCode).toBe(422);
    expect(problemCode(missing)).toBe('persona.not_found');
    const cleared = await owner.call('PATCH', `/v1/channels/${xChannelId}`, { personaId: null });
    expect(cleared.json().personaId).toBeNull();
  });

  it('tests a channel with a real read call and records failures as health', async () => {
    const good = await owner.post(`/v1/channels/${xChannelId}/test`, {});
    expect(good.statusCode, good.body).toBe(200);
    expect(good.json()).toMatchObject({ ok: true, handle: 'deniz_x', health: 'ok' });

    state.xRevoked = true;
    const bad = await owner.post(`/v1/channels/${xChannelId}/test`, {});
    expect(bad.json()).toMatchObject({ ok: false, health: 'token_expired' });
    expect(bad.json().detail).toContain('401');
    const dto = ChannelDtoSchema.parse((await owner.get(`/v1/channels/${xChannelId}`)).json());
    expect(dto.health).toBe('token_expired');
    expect(dto.lastError?.code).toBe('channel.provider_rejected');
    state.xRevoked = false;
  });

  it('refreshes an OAuth token and rotates the stored credential', async () => {
    const service = app.get(ChannelService);
    const workspaceId = ChannelDtoSchema.parse(
      (await owner.get(`/v1/channels/${xChannelId}`)).json(),
    ).workspaceId;
    const refreshed = await service.refreshToken(workspaceId, xChannelId);
    expect(refreshed.ok).toBe(true);
    if (!refreshed.ok) return;
    expect(refreshed.value.health).toBe('ok');
    // The probe now succeeds only with the rotated token (fake provider switched to x-access-2).
    const probe = await owner.post(`/v1/channels/${xChannelId}/test`, {});
    expect(probe.json()).toMatchObject({ ok: true, health: 'ok' });
  });

  it('disconnects and destroys the credential', async () => {
    const res = await owner.call('DELETE', `/v1/channels/${telegramChannelId}`);
    expect(res.statusCode, res.body).toBe(204);
    const gone = await owner.get(`/v1/channels/${telegramChannelId}`);
    expect(problemCode(gone)).toBe('channel.not_found');
    const rows = rowsOf<{ n: string }>(
      await handle.db.execute(sql`select count(*)::text as n from credentials`),
    );
    expect(Number(rows[0]?.n)).toBe(1);
  });

  it('runs the Instagram flow with the long-lived token exchange', async () => {
    const start = await owner.post('/v1/channels/oauth/instagram/start', {});
    expect(start.statusCode, start.body).toBe(200);
    const url = new URL(start.json().url);
    expect(url.searchParams.get('scope')).toBe(
      'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights',
    );
    expect(url.searchParams.has('code_challenge')).toBe(false);
    const done = await new TestClient(app).get(
      `/v1/channels/oauth/instagram/callback?code=ig-code&state=${start.json().state}`,
    );
    const id = new URL(done.headers['location'] as string).searchParams.get('connected');
    expect(id, done.headers['location'] as string).toBeTruthy();
    const dto = ChannelDtoSchema.parse((await owner.get(`/v1/channels/${id}`)).json());
    expect(dto).toMatchObject({
      platform: 'instagram',
      handle: 'deniz.ig',
      externalAccountId: '9001',
    });
    const days = (new Date(dto.tokenExpiresAt ?? 0).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(59);
    expect(days).toBeLessThan(61);
  });

  it('purges expired OAuth states', async () => {
    const repo = new DrizzleOAuthStateRepository(handle.db);
    const future = new Date(Date.now() + 365 * 86_400_000);
    expect(await repo.purgeExpired(future)).toBeGreaterThanOrEqual(0);
    expect(await repo.consume('nothing', 'x', new Date())).toBeNull();
  });
});

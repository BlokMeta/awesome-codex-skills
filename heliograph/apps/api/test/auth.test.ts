import 'reflect-metadata';
import { MeResponseSchema, ProblemSchema } from '@heliograph/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';
import type { DatabaseHandle } from '../src/db/client.js';
import { DrizzlePolicyRepository } from '../src/modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from '../src/modules/config/infrastructure/seed.js';
import { DrizzleMembershipRepository } from '../src/modules/identity/infrastructure/drizzle-membership.repository.js';
import { LogEmailSender } from '../src/modules/identity/infrastructure/log-email-sender.js';
import { testIdentityOptions } from './support/auth.js';
import { createTestDatabase } from './support/db.js';
import { TestClient } from './support/http.js';
import { totpFromUri } from './support/totp.js';

let app: NestFastifyApplication;
let handle: DatabaseHandle;
const email = new LogEmailSender();
const AUTH = '/v1/auth';
const password = 'correct horse battery staple';

beforeAll(async () => {
  handle = await createTestDatabase();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
  app = await createApp({ db: handle.db, identity: testIdentityOptions(email) });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await handle.close();
});

describe('authentication (better-auth on Fastify)', () => {
  const ayse = () => new TestClient(app);
  let owner: TestClient;
  let workspaceId: string;

  it('rejects protected routes without a session with an RFC 9457 problem', async () => {
    const res = await ayse().get('/v1/me');
    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const problem = ProblemSchema.parse(res.json());
    expect(problem.code).toBe('auth.unauthenticated');
    expect(problem.requestId).toBeTruthy();
  });

  it('keeps health public', async () => {
    expect((await ayse().get('/v1/health')).statusCode).toBe(200);
  });

  it('signs up with email + password, sets an HttpOnly cookie and serves /v1/me', async () => {
    owner = ayse();
    const res = await owner.post(`${AUTH}/sign-up/email`, {
      name: 'Ayşe',
      email: 'ayse@example.com',
      password,
      locale: 'tr',
      timezone: 'Europe/Istanbul',
    });
    expect(res.statusCode, res.body).toBe(200);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toContain('hg.session_token=');
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(email.sent.some((m) => m.subject === 'auth.verifyEmail.subject')).toBe(true);

    const me = await owner.get('/v1/me');
    expect(me.statusCode, me.body).toBe(200);
    const body = MeResponseSchema.parse(me.json());
    expect(body.operator).toMatchObject({ email: 'ayse@example.com', name: 'Ayşe', locale: 'tr' });
    expect(body.workspaces).toEqual([]);
    expect(body.activeWorkspaceId).toBeNull();
  });

  it('rejects a short password', async () => {
    const res = await ayse().post(`${AUTH}/sign-up/email`, {
      name: 'x',
      email: 'short@example.com',
      password: 'short',
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates a workspace (organization) whose owner membership the domain repository sees', async () => {
    const res = await owner.post(`${AUTH}/organization/create`, {
      name: 'Atölye A',
      slug: 'atolye-a',
    });
    expect(res.statusCode, res.body).toBe(200);
    workspaceId = res.json().id;
    const rows = await new DrizzleMembershipRepository(handle.db).listForWorkspace(workspaceId);
    expect(rows).toMatchObject([{ role: 'owner' }]);

    const me = MeResponseSchema.parse((await owner.get('/v1/me')).json());
    expect(me.workspaces).toEqual([
      { id: workspaceId, name: 'Atölye A', slug: 'atolye-a', role: 'owner' },
    ]);

    const active = await owner.post(`${AUTH}/organization/set-active`, {
      organizationId: workspaceId,
    });
    expect(active.statusCode, active.body).toBe(200);
    expect(MeResponseSchema.parse((await owner.get('/v1/me')).json()).activeWorkspaceId).toBe(
      workspaceId,
    );
  });

  it('invites an editor; the invitee accepts after signing up and gets the editor role', async () => {
    const invite = await owner.post(`${AUTH}/organization/invite-member`, {
      email: 'bora@example.com',
      role: 'editor',
      organizationId: workspaceId,
    });
    expect(invite.statusCode, invite.body).toBe(200);
    const invitationId = invite.json().id as string;
    expect(email.sent.at(-1)).toMatchObject({
      to: 'bora@example.com',
      text: `http://localhost:3000/invite/${invitationId}`,
    });

    const bora = ayse();
    await bora.post(`${AUTH}/sign-up/email`, { name: 'Bora', email: 'bora@example.com', password });
    const unverified = await bora.post(`${AUTH}/organization/accept-invitation`, { invitationId });
    expect(unverified.statusCode).toBe(403); // invitations need a verified email

    const verifyMail = email.sent.find(
      (m) => m.to === 'bora@example.com' && m.subject === 'auth.verifyEmail.subject',
    );
    if (!verifyMail) throw new Error('no verification email');
    const verify = await bora.get(
      new URL(verifyMail.text).pathname + new URL(verifyMail.text).search,
    );
    expect([200, 302]).toContain(verify.statusCode);
    expect(MeResponseSchema.parse((await bora.get('/v1/me')).json()).operator.emailVerified).toBe(
      true,
    );

    const accept = await bora.post(`${AUTH}/organization/accept-invitation`, { invitationId });
    expect(accept.statusCode, accept.body).toBe(200);
    const me = MeResponseSchema.parse((await bora.get('/v1/me')).json());
    expect(me.workspaces).toEqual([
      { id: workspaceId, name: 'Atölye A', slug: 'atolye-a', role: 'editor' },
    ]);

    const denied = await bora.post(`${AUTH}/organization/has-permission`, {
      permissions: { members: ['invite'] },
    });
    expect(denied.json().success).toBe(false);
    const allowed = await bora.post(`${AUTH}/organization/has-permission`, {
      permissions: { content: ['review'] },
    });
    expect(allowed.json().success).toBe(true);
  });

  it('an editor cannot invite members (organization plugin honours the role matrix)', async () => {
    const bora = ayse();
    await bora.post(`${AUTH}/sign-in/email`, { email: 'bora@example.com', password });
    const res = await bora.post(`${AUTH}/organization/invite-member`, {
      email: 'cem@example.com',
      role: 'viewer',
      organizationId: workspaceId,
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('enables TOTP, then sign-in requires the second factor', async () => {
    const enable = await owner.post(`${AUTH}/two-factor/enable`, { password });
    expect(enable.statusCode, enable.body).toBe(200);
    const { totpURI, backupCodes } = enable.json() as { totpURI: string; backupCodes: string[] };
    expect(totpURI).toContain('issuer=Heliograph');
    expect(backupCodes.length).toBeGreaterThan(0);
    const verify = await owner.post(`${AUTH}/two-factor/verify-totp`, {
      code: totpFromUri(totpURI),
    });
    expect(verify.statusCode, verify.body).toBe(200);
    expect(
      MeResponseSchema.parse((await owner.get('/v1/me')).json()).operator.twoFactorEnabled,
    ).toBe(true);

    const fresh = ayse();
    const signIn = await fresh.post(`${AUTH}/sign-in/email`, {
      email: 'ayse@example.com',
      password,
    });
    expect(signIn.statusCode, signIn.body).toBe(200);
    expect(signIn.json().twoFactorRedirect).toBe(true);
    expect((await fresh.get('/v1/me')).statusCode).toBe(401);

    const wrong = await fresh.post(`${AUTH}/two-factor/verify-totp`, { code: '000000' });
    expect(wrong.statusCode).toBeGreaterThanOrEqual(400);
    const ok = await fresh.post(`${AUTH}/two-factor/verify-totp`, { code: totpFromUri(totpURI) });
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await fresh.get('/v1/me')).statusCode).toBe(200);
  });

  it('serves passkey registration options bound to the web origin', async () => {
    const res = await owner.get(`${AUTH}/passkey/generate-register-options`);
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json().rp).toMatchObject({ id: 'localhost', name: 'Heliograph' });
  });

  it('mobile path: bearer token from sign-in authenticates without cookies', async () => {
    const bora = ayse();
    const signIn = await bora.post(`${AUTH}/sign-in/email`, {
      email: 'bora@example.com',
      password,
    });
    const token = signIn.headers['set-auth-token'];
    expect(typeof token).toBe('string');
    const device = new TestClient(app);
    device.bearer = String(token);
    const me = await device.get('/v1/me');
    expect(me.statusCode, me.body).toBe(200);
    expect(me.json().operator.email).toBe('bora@example.com');
  });

  it('sign-out revokes the session', async () => {
    const bora = ayse();
    await bora.post(`${AUTH}/sign-in/email`, { email: 'bora@example.com', password });
    expect((await bora.get('/v1/me')).statusCode).toBe(200);
    const out = await bora.post(`${AUTH}/sign-out`);
    expect(out.statusCode, out.body).toBe(200);
    expect((await bora.get('/v1/me')).statusCode).toBe(401);
  });
});

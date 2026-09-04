import { describe, expect, it } from 'vitest';
import {
  assignPersona,
  type Channel,
  canPublish,
  connectChannel,
  healthFromExpiry,
  recordFailure,
} from './channel.js';

const now = new Date('2026-09-04T12:00:00Z');
const base = () =>
  connectChannel({
    id: '01J8Z3M9K2Q4R5S6T7V8W9X0C1',
    workspaceId: '01J8Z3M9K2Q4R5S6T7V8W9X0W1',
    personaId: null,
    platform: 'threads',
    credentialId: '01J8Z3M9K2Q4R5S6T7V8W9X0K1',
    scopes: ['threads_basic', 'threads_content_publish'],
    capabilities: { publish: ['text', 'image'], comments: 'full', dm: 'none', insights: true },
    account: { externalAccountId: '178', handle: 'deniz', displayName: 'Deniz' },
    tokenExpiresAt: new Date(now.getTime() + 60 * 86_400_000),
    now,
  });

describe('Channel', () => {
  it('connects with health ok and validates the shape', () => {
    const r = base();
    expect(r.ok && r.value.health).toBe('ok');
    const bad = connectChannel({
      id: 'x',
      workspaceId: 'y',
      personaId: null,
      platform: 'x',
      credentialId: 'z',
      scopes: [],
      capabilities: { publish: [], comments: 'none', dm: 'none', insights: false },
      account: { externalAccountId: '1', handle: 'h', displayName: '' },
      tokenExpiresAt: null,
      now,
    });
    expect(!bad.ok && bad.error.code).toBe('channel.invalid');
  });

  it('derives token health from expiry and keeps terminal states', () => {
    const r = base();
    if (!r.ok) throw new Error('bad fixture');
    const c: Channel = r.value;
    const expiresAt = c.tokenExpiresAt?.getTime() ?? Number.NaN;
    expect(healthFromExpiry(c, now)).toBe('ok');
    expect(healthFromExpiry(c, new Date(expiresAt - 3_600_000))).toBe('token_expiring');
    expect(healthFromExpiry(c, new Date(expiresAt + 1))).toBe('token_expired');
    expect(healthFromExpiry({ ...c, health: 'banned' }, now)).toBe('banned');
    expect(healthFromExpiry({ ...c, tokenExpiresAt: null, health: 'rate_limited' }, now)).toBe(
      'rate_limited',
    );
    expect(healthFromExpiry({ ...c, tokenExpiresAt: null }, now)).toBe('ok');
    const soon = new Date(expiresAt - 3_600_000);
    expect(healthFromExpiry(c, soon, { refreshable: true })).toBe('ok');
    expect(healthFromExpiry({ ...c, health: 'rate_limited' }, soon, { refreshable: true })).toBe(
      'rate_limited',
    );
  });

  it('records failures, assigns personas and checks publish capability', () => {
    const r = base();
    if (!r.ok) throw new Error('bad fixture');
    const failed = recordFailure(
      r.value,
      { code: 'rate', message: '429', health: 'rate_limited' },
      now,
    );
    expect(failed.health).toBe('rate_limited');
    expect(failed.lastError?.at).toEqual(now);
    expect(assignPersona(failed, '01J8Z3M9K2Q4R5S6T7V8W9X0P1').personaId).toBe(
      '01J8Z3M9K2Q4R5S6T7V8W9X0P1',
    );
    expect(canPublish(r.value, 'text')).toBe(true);
    expect(canPublish(r.value, 'video')).toBe(false);
  });
});

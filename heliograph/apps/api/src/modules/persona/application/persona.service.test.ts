import {
  createDraft,
  type DomainError,
  fixedClock,
  ok,
  type Persona,
  type PersonaRecord,
  type PersonaRepository,
  type Result,
} from '@heliograph/domain';
import { describe, expect, it, vi } from 'vitest';
import type { EntitlementService } from '../../billing/application/entitlement.service.js';
import type { Authorizer } from '../../identity/application/authorizer.js';
import { PersonaService, slugify } from './persona.service.js';

const now = new Date('2026-09-04T12:00:00Z');
const WS = '01J8Z3M9K2Q4R5S6T7V8W9X0W1';
const actor = { operatorId: 'op', workspaceId: WS };

class MemRepo implements PersonaRepository {
  rows = new Map<string, PersonaRecord>();
  async findById(ws: string, id: string) {
    const r = this.rows.get(id);
    return r && r.workspaceId === ws ? r : null;
  }
  async findBySlug(ws: string, slug: string) {
    return [...this.rows.values()].find((r) => r.workspaceId === ws && r.slug === slug) ?? null;
  }
  async list(ws: string, opts: { limit: number }) {
    const items = [...this.rows.values()].filter((r) => r.workspaceId === ws).slice(0, opts.limit);
    return { items, hasMore: false };
  }
  async save(p: Persona) {
    const rec = { ...p, createdAt: now, updatedAt: now };
    this.rows.set(p.id, rec);
    return rec;
  }
  async countActive(ws: string) {
    return [...this.rows.values()].filter((r) => r.workspaceId === ws && r.status !== 'archived')
      .length;
  }
}

function service(opts: { allow?: boolean; personaLimit?: number | null } = {}) {
  const repo = new MemRepo();
  const authorizer = {
    assert: vi.fn(
      async (): Promise<Result<unknown, DomainError>> =>
        opts.allow === false
          ? {
              ok: false,
              error: { code: 'identity.forbidden', messageId: 'errors.identity.forbidden' },
            }
          : ok({ operatorId: 'op', workspaceId: WS, role: 'editor' }),
    ),
  } as unknown as Authorizer;
  const limit = opts.personaLimit === undefined ? 1 : opts.personaLimit;
  const entitlements = {
    assert: vi.fn(async (_ws: string, _f: string, o: { currentCount?: number }) =>
      limit !== null && (o.currentCount ?? 0) >= limit
        ? { ok: false, error: { code: 'billing.entitlement_exceeded', messageId: 'x' } }
        : ok({}),
    ),
  } as unknown as EntitlementService;
  return { svc: new PersonaService(repo, authorizer, entitlements, fixedClock(now)), repo };
}

describe('PersonaService', () => {
  it('slugifies Turkish names', () => {
    expect(slugify('Deniz | Platform Mühendisi')).toBe('deniz-platform-muhendisi');
  });

  it('creates a draft with a derived slug, then refuses a duplicate slug and the plan limit', async () => {
    const { svc } = service({ personaLimit: 1 });
    const created = await svc.create(actor, {
      name: 'Deniz Işık',
      niche: 'devops',
      language: 'tr',
      timezone: 'Europe/Istanbul',
    });
    expect(created.ok && created.value.slug).toBe('deniz-isik');
    const dup = await svc.create(actor, {
      name: 'x',
      slug: 'deniz-isik',
      niche: 'ai',
      language: 'en',
      timezone: 'UTC',
    });
    expect(!dup.ok && dup.error.code).toBe('billing.entitlement_exceeded');
    const { svc: roomy } = service({ personaLimit: null });
    await roomy.create(actor, {
      name: 'A',
      slug: 'same',
      niche: 'ai',
      language: 'en',
      timezone: 'UTC',
    });
    const again = await roomy.create(actor, {
      name: 'B',
      slug: 'same',
      niche: 'ai',
      language: 'en',
      timezone: 'UTC',
    });
    expect(!again.ok && again.error.code).toBe('persona.slug_taken');
  });

  it('denies every use-case to an unauthorized actor', async () => {
    const { svc } = service({ allow: false });
    for (const r of [
      await svc.list(actor, { limit: 10 }),
      await svc.get(actor, 'x'),
      await svc.create(actor, { name: 'A', niche: 'ai', language: 'en', timezone: 'UTC' }),
      await svc.update(actor, 'x', {}, null),
      await svc.activate(actor, 'x'),
    ]) {
      expect(!r.ok && r.error.code).toBe('identity.forbidden');
    }
  });

  it('updates any step, blocks starting until the voice bible is ready, then walks the lifecycle', async () => {
    const { svc } = service({ personaLimit: null });
    const created = await svc.create(actor, {
      name: 'Deniz',
      niche: 'devops',
      language: 'tr',
      timezone: 'Europe/Istanbul',
    });
    if (!created.ok) throw new Error('create failed');
    const id = created.value.id;
    const notReady = await svc.activate(actor, id);
    expect(!notReady.ok && notReady.error.code).toBe('persona.incomplete');

    const bad = await svc.update(
      actor,
      id,
      { postingPolicy: { ...created.value.postingPolicy, windows: [] } },
      null,
    );
    expect(!bad.ok && bad.error.params?.['issue']).toBe('postingPolicy.windows');

    const updated = await svc.update(
      actor,
      id,
      {
        voiceBible: {
          ...created.value.voiceBible,
          summary:
            'Platform mühendisi; Kubernetes üzerine somut deneyim notları paylaşır, kısa yazar.',
          tone: ['dry'],
        },
        topicProfile: { ...created.value.topicProfile, include: ['kubernetes'] },
      },
      'wizard step 2',
    );
    expect(updated.ok).toBe(true);
    const started = await svc.activate(actor, id);
    expect(started.ok && started.value.status).toBe('warming');
    expect(started.ok && started.value.warmupStartedAt).toEqual(now);
    const paused = await svc.pause(actor, id);
    expect(paused.ok && paused.value.status).toBe('paused');
    const archived = await svc.archive(actor, id);
    expect(archived.ok && archived.value.status).toBe('archived');
    const afterArchive = await svc.update(actor, id, { name: 'x' }, null);
    expect(!afterArchive.ok && afterArchive.error.code).toBe('persona.archived');
    expect(!(await svc.get(actor, 'missing')).ok).toBe(true);
    const draftCheck = createDraft({
      id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
      workspaceId: WS,
      slug: 'ok',
      name: 'ok',
      niche: 'ai',
      language: 'en',
      timezone: 'UTC',
    });
    expect(draftCheck.ok).toBe(true);
  });
});

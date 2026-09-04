import { type ConsentRepository, fixedClock, type StoredConsent } from '@heliograph/domain';
import { describe, expect, it } from 'vitest';
import { ConsentService } from './consent.service.js';

const now = new Date('2026-09-15T10:00:00Z');
const versions: Record<string, string> = {
  'legal.terms.version': '2026-09-03',
  'legal.privacy.version': '2026-09-03',
  'legal.aup.version': '2026-09-03',
  'legal.ai_processing.version': '2026-09-03',
  'legal.kvkk_aydinlatma.version': '2026-09-03',
  'legal.cookies.version': '2026-09-03',
  'legal.kvkk_acik_riza_marketing.version': '2026-09-03',
};
const config = {
  get: async <T>(key: string, parse: (v: unknown) => T) => {
    if (!(key in versions)) throw new Error('config key missing');
    return parse(versions[key]);
  },
};

class MemRepo implements ConsentRepository {
  rows: StoredConsent[] = [];
  async listForOperator(op: string) {
    return this.rows.filter((r) => r.operatorId === op);
  }
  async append(records: readonly Omit<StoredConsent, 'withdrawnAt'>[]) {
    this.rows.push(...records.map((r) => ({ ...r, withdrawnAt: null })));
  }
  async withdraw(op: string, doc: StoredConsent['document'], at: Date) {
    this.rows = this.rows.map((r) =>
      r.operatorId === op && r.document === doc && !r.withdrawnAt ? { ...r, withdrawnAt: at } : r,
    );
  }
}

describe('ConsentService', () => {
  it('reports the four signup documents as pending, then none after acceptance', async () => {
    const repo = new MemRepo();
    const svc = new ConsentService(repo, config, fixedClock(now));
    const before = await svc.status('op');
    expect(before.pending).toEqual(['terms', 'privacy', 'aup', 'ai_processing']);
    expect(before.published['distance_sale']).toBeUndefined();
    const res = await svc.accept(
      'op',
      before.pending.map((document) => ({ document, version: '2026-09-03' })),
      { ip: '127.0.0.1', userAgent: 'test' },
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.pending).toEqual([]);
      expect(res.value.accepted.length).toBe(4);
      expect(res.value.optional['cookies']).toBe('not_granted');
    }
    expect(repo.rows[0]).toMatchObject({ ip: '127.0.0.1', acceptedAt: now });
  });

  it('rejects outdated or unpublished versions', async () => {
    const svc = new ConsentService(new MemRepo(), config, fixedClock(now));
    const stale = await svc.accept('op', [{ document: 'terms', version: '2025-01-01' }], {
      ip: null,
      userAgent: null,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe('privacy.version_outdated');
    const unpublished = await svc.accept(
      'op',
      [{ document: 'distance_sale', version: '2026-09-03' }],
      { ip: null, userAgent: null },
    );
    expect(unpublished.ok).toBe(false);
    if (!unpublished.ok) expect(unpublished.error.code).toBe('privacy.document_not_published');
  });

  it('withdraws optional consents only', async () => {
    const repo = new MemRepo();
    const svc = new ConsentService(repo, config, fixedClock(now));
    await svc.accept('op', [{ document: 'cookies', version: '2026-09-03' }], {
      ip: null,
      userAgent: null,
    });
    expect((await svc.status('op')).optional['cookies']).toBe('granted');
    const withdrawn = await svc.withdraw('op', 'cookies');
    expect(withdrawn.ok && withdrawn.value.optional['cookies']).toBe('not_granted');
    const refused = await svc.withdraw('op', 'terms');
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error.code).toBe('privacy.not_withdrawable');
  });
});

import { describe, expect, it } from 'vitest';
import {
  type ConsentRecord,
  hasCurrentConsent,
  optionalConsentState,
  type PublishedVersions,
  pendingRequired,
  withdraw,
} from './consent.js';

const published: PublishedVersions = {
  terms: '2026-09-03',
  privacy: '2026-09-03',
  aup: '2026-09-03',
  ai_processing: '2026-09-03',
  distance_sale: '2026-09-03',
  kvkk_acik_riza_marketing: '2026-09-03',
  cookies: '2026-09-03',
};
const at = new Date('2026-09-03T10:00:00Z');
const accept = (document: ConsentRecord['document'], version = '2026-09-03'): ConsentRecord => ({
  document,
  version,
  acceptedAt: at,
  withdrawnAt: null,
});

describe('consent', () => {
  it('requires terms, privacy and AUP at signup and distance sale only for Turkish checkout', () => {
    expect(pendingRequired([], published)).toEqual(['terms', 'privacy', 'aup', 'ai_processing']);
    expect(
      pendingRequired(
        [accept('terms'), accept('privacy'), accept('aup'), accept('ai_processing')],
        published,
      ),
    ).toEqual([]);
    expect(
      pendingRequired(
        [accept('terms'), accept('privacy'), accept('aup'), accept('ai_processing')],
        published,
        { checkoutInTurkey: true },
      ),
    ).toEqual(['distance_sale']);
  });

  it('demands re-acceptance when the published version moves ahead', () => {
    const old = [
      accept('terms', '2026-01-01'),
      accept('privacy'),
      accept('aup'),
      accept('ai_processing'),
    ];
    expect(pendingRequired(old, published)).toEqual(['terms']);
    expect(hasCurrentConsent(old, 'terms', published)).toBe(false);
    expect(hasCurrentConsent(old, 'privacy', published)).toBe(true);
  });

  it('treats a withdrawn consent as absent and unknown documents as unpublished', () => {
    const records = withdraw([accept('kvkk_acik_riza_marketing')], 'kvkk_acik_riza_marketing', at);
    expect(records[0]?.withdrawnAt).toBe(at);
    expect(hasCurrentConsent(records, 'kvkk_acik_riza_marketing', published)).toBe(false);
    expect(
      hasCurrentConsent([accept('kvkk_acik_riza_voice')], 'kvkk_acik_riza_voice', published),
    ).toBe(false);
  });

  it('reports optional consents as granted / not granted / outdated', () => {
    const state = optionalConsentState(
      [accept('kvkk_acik_riza_marketing'), accept('cookies', '2025-01-01')],
      published,
    );
    expect(state).toEqual({
      kvkk_acik_riza_marketing: 'granted',
      kvkk_acik_riza_voice: 'not_granted',
      kvkk_acik_riza_likeness: 'not_granted',
      cookies: 'outdated',
    });
  });
});

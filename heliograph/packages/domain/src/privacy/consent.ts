import { z } from 'zod';

/**
 * Consent records (docs/16 §7, CLAUDE.md rule 15). Which legal documents a person has accepted,
 * at which version; re-acceptance is required when the published version moves ahead.
 */
export const LegalDocumentSchema = z.enum([
  'terms',
  'privacy',
  'kvkk_aydinlatma',
  'kvkk_acik_riza_marketing',
  'kvkk_acik_riza_voice',
  'kvkk_acik_riza_likeness',
  'cookies',
  'distance_sale',
  'aup',
  'ai_processing',
]);
export type LegalDocument = z.infer<typeof LegalDocumentSchema>;

/**
 * Documents that must be accepted before the product can be used at all.
 * `ai_processing` = explicit permission to share personal data with third-party AI providers
 * (Apple Guideline 5.1.2(i); also the KVKK/GDPR transparency anchor for LLM sub-processors).
 */
export const REQUIRED_AT_SIGNUP: readonly LegalDocument[] = [
  'terms',
  'privacy',
  'aup',
  'ai_processing',
];
/** Shown (not ticked) at signup: informational under KVKK; recorded as "acknowledged". */
export const ACKNOWLEDGED_AT_SIGNUP: readonly LegalDocument[] = ['kvkk_aydinlatma'];
/** Required at the payment step for consumers in Türkiye. */
export const REQUIRED_AT_CHECKOUT_TR: readonly LegalDocument[] = ['distance_sale'];
/** Opt-in only; never pre-ticked; withdrawable. */
export const OPTIONAL_CONSENTS: readonly LegalDocument[] = [
  'kvkk_acik_riza_marketing',
  'kvkk_acik_riza_voice',
  'kvkk_acik_riza_likeness',
  'cookies',
];

/** Version strings are ISO dates (legal/*.md front matter); lexical order == chronological. */
export const VersionSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export interface ConsentRecord {
  readonly document: LegalDocument;
  readonly version: string;
  readonly acceptedAt: Date;
  readonly withdrawnAt: Date | null;
}

export type PublishedVersions = Readonly<Partial<Record<LegalDocument, string>>>;

function latestActive(records: readonly ConsentRecord[], doc: LegalDocument): ConsentRecord | null {
  let best: ConsentRecord | null = null;
  for (const r of records) {
    if (r.document !== doc || r.withdrawnAt) continue;
    if (!best || r.version > best.version) best = r;
  }
  return best;
}

/** True when the person holds a non-withdrawn acceptance of the currently published version. */
export function hasCurrentConsent(
  records: readonly ConsentRecord[],
  doc: LegalDocument,
  published: PublishedVersions,
): boolean {
  const version = published[doc];
  if (!version) return false;
  const active = latestActive(records, doc);
  return active !== null && active.version === version;
}

/** Documents the person must (re)accept before continuing, in display order. */
export function pendingRequired(
  records: readonly ConsentRecord[],
  published: PublishedVersions,
  ctx: { checkoutInTurkey?: boolean } = {},
): LegalDocument[] {
  const required: LegalDocument[] = [...REQUIRED_AT_SIGNUP];
  if (ctx.checkoutInTurkey) required.push(...REQUIRED_AT_CHECKOUT_TR);
  return required.filter((doc) => !hasCurrentConsent(records, doc, published));
}

export function optionalConsentState(
  records: readonly ConsentRecord[],
  published: PublishedVersions,
): Record<(typeof OPTIONAL_CONSENTS)[number], 'granted' | 'not_granted' | 'outdated'> {
  const out = {} as Record<
    (typeof OPTIONAL_CONSENTS)[number],
    'granted' | 'not_granted' | 'outdated'
  >;
  for (const doc of OPTIONAL_CONSENTS) {
    const active = latestActive(records, doc);
    if (!active) out[doc] = 'not_granted';
    else if (published[doc] && active.version !== published[doc]) out[doc] = 'outdated';
    else out[doc] = 'granted';
  }
  return out;
}

export function withdraw(
  records: readonly ConsentRecord[],
  doc: LegalDocument,
  now: Date,
): ConsentRecord[] {
  return records.map((r) =>
    r.document === doc && !r.withdrawnAt ? { ...r, withdrawnAt: now } : r,
  );
}

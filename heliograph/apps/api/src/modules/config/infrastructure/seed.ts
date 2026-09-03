import type { PolicyEntry } from '@heliograph/domain';
import { configSeed } from '@heliograph/seed';
import { ulid } from 'ulid';

/** Turns the static seed into PolicyEntry rows, all verified "now" by the seed itself. */
export function seedEntries(verifiedAt: Date): PolicyEntry[] {
  return configSeed.map((s) => ({
    id: ulid(verifiedAt.getTime()),
    key: s.key,
    scope: s.scope,
    scopeId: s.scopeId,
    value: s.value,
    version: 1,
    effectiveFrom: verifiedAt,
    verifiedAt,
    verifiedBy: 'seed',
    sourceUrl: s.sourceUrl,
    maxAgeDays: s.maxAgeDays,
    notes: s.notes ?? null,
  }));
}

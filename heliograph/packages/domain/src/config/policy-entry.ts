import { z } from 'zod';
import { IdSchema } from '../shared/id.js';

/**
 * Dynamic configuration (ADR-0011). Every "constant" that can change in the outside world
 * — platform limits, prices, model names, legal document versions, retention days —
 * is a versioned PolicyEntry with a verification timestamp and a source URL.
 */
export const PolicyScopeSchema = z.enum(['global', 'platform', 'workspace']);
export type PolicyScope = z.infer<typeof PolicyScopeSchema>;

export const PolicyKeySchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:\.[a-z0-9_]+)+$/,
    'key must be dotted lowercase, e.g. platform.instagram.publish_limit_24h',
  );

export const PolicyEntrySchema = z.object({
  id: IdSchema,
  key: PolicyKeySchema,
  scope: PolicyScopeSchema,
  scopeId: z.string().nullable(),
  value: z.unknown(),
  version: z.number().int().positive(),
  effectiveFrom: z.date(),
  verifiedAt: z.date(),
  verifiedBy: z.string(),
  sourceUrl: z.string().url().nullable(),
  maxAgeDays: z.number().int().positive(),
  notes: z.string().nullable(),
});
export type PolicyEntry = z.infer<typeof PolicyEntrySchema>;

export const StalenessLevelSchema = z.enum(['fresh', 'warning', 'critical']);
export type StalenessLevel = z.infer<typeof StalenessLevelSchema>;

export interface Staleness {
  readonly key: string;
  readonly scope: PolicyScope;
  readonly scopeId: string | null;
  readonly ageDays: number;
  readonly maxAgeDays: number;
  readonly overdueDays: number;
  readonly level: StalenessLevel;
}

const DAY_MS = 86_400_000;

const sameTarget = (e: PolicyEntry, key: string, scope: PolicyScope, scopeId: string | null) =>
  e.key === key && e.scope === scope && e.scopeId === scopeId;

/**
 * Picks the entry that is in force at `now`: the highest version whose effectiveFrom is not in
 * the future. Future-dated versions let operators schedule changes (e.g. a price change on the 1st).
 */
export function resolveEffective(
  entries: readonly PolicyEntry[],
  key: string,
  now: Date,
  scope: PolicyScope = 'global',
  scopeId: string | null = null,
): PolicyEntry | null {
  let best: PolicyEntry | null = null;
  for (const e of entries) {
    if (!sameTarget(e, key, scope, scopeId)) continue;
    if (e.effectiveFrom.getTime() > now.getTime()) continue;
    if (best === null || e.version > best.version) best = e;
  }
  return best;
}

/**
 * Scope fallback: workspace → platform → global. Lets a tenant override a platform default
 * (e.g. a lower daily limit during warm-up) without touching the global value.
 */
export function resolveWithFallback(
  entries: readonly PolicyEntry[],
  key: string,
  now: Date,
  ctx: { workspaceId?: string; platform?: string } = {},
): PolicyEntry | null {
  if (ctx.workspaceId) {
    const ws = resolveEffective(entries, key, now, 'workspace', ctx.workspaceId);
    if (ws) return ws;
  }
  if (ctx.platform) {
    const p = resolveEffective(entries, key, now, 'platform', ctx.platform);
    if (p) return p;
  }
  return resolveEffective(entries, key, now, 'global', null);
}

/** Age of the verification, in whole days, never negative. */
export function ageInDays(entry: PolicyEntry, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - entry.verifiedAt.getTime()) / DAY_MS));
}

/**
 * fresh: within maxAgeDays; warning: past maxAgeDays; critical: past 2 × maxAgeDays.
 * The staleness watcher (Temporal cron) turns warning/critical into alerts.
 */
export function staleness(entry: PolicyEntry, now: Date): Staleness {
  const age = ageInDays(entry, now);
  const overdue = Math.max(0, age - entry.maxAgeDays);
  const level: StalenessLevel =
    overdue === 0 ? 'fresh' : age >= entry.maxAgeDays * 2 ? 'critical' : 'warning';
  return {
    key: entry.key,
    scope: entry.scope,
    scopeId: entry.scopeId,
    ageDays: age,
    maxAgeDays: entry.maxAgeDays,
    overdueDays: overdue,
    level,
  };
}

/** Staleness of every currently-effective entry (one per key/scope/scopeId), stale first. */
export function stalenessReport(entries: readonly PolicyEntry[], now: Date): Staleness[] {
  const seen = new Set<string>();
  const report: Staleness[] = [];
  for (const e of entries) {
    const id = `${e.scope}|${e.scopeId ?? ''}|${e.key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const effective = resolveEffective(entries, e.key, now, e.scope, e.scopeId);
    if (effective) report.push(staleness(effective, now));
  }
  return report.sort((a, b) => b.overdueDays - a.overdueDays || a.key.localeCompare(b.key));
}

/** Creates the next version of an entry with a fresh verification stamp. */
export function reverify(
  entry: PolicyEntry,
  by: string,
  now: Date,
  changes: Partial<Pick<PolicyEntry, 'value' | 'sourceUrl' | 'notes' | 'maxAgeDays'>> = {},
  nextId: string = entry.id,
): PolicyEntry {
  const valueChanged = 'value' in changes && changes.value !== entry.value;
  return {
    ...entry,
    ...changes,
    id: nextId,
    version: valueChanged ? entry.version + 1 : entry.version,
    effectiveFrom: valueChanged ? now : entry.effectiveFrom,
    verifiedAt: now,
    verifiedBy: by,
  };
}

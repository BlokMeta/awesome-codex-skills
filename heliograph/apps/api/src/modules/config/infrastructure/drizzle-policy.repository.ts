import { type PolicyEntry, PolicyEntrySchema, type PolicyRepository } from '@heliograph/domain';
import { eq } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import { policyEntries } from './schema.js';

type Row = typeof policyEntries.$inferSelect;

const toEntry = (r: Row): PolicyEntry =>
  PolicyEntrySchema.parse({
    id: r.id,
    key: r.key,
    scope: r.scope,
    scopeId: r.scopeId,
    value: r.value,
    version: r.version,
    effectiveFrom: r.effectiveFrom,
    verifiedAt: r.verifiedAt,
    verifiedBy: r.verifiedBy,
    sourceUrl: r.sourceUrl,
    maxAgeDays: r.maxAgeDays,
    notes: r.notes,
  });

const toRow = (e: PolicyEntry): typeof policyEntries.$inferInsert => ({
  id: e.id,
  key: e.key,
  scope: e.scope,
  scopeId: e.scopeId,
  value: e.value,
  version: e.version,
  effectiveFrom: e.effectiveFrom,
  verifiedAt: e.verifiedAt,
  verifiedBy: e.verifiedBy,
  sourceUrl: e.sourceUrl,
  maxAgeDays: e.maxAgeDays,
  notes: e.notes,
});

/**
 * Postgres-backed PolicyRepository. Rows are append-only per (key, scope, scopeId, version);
 * `save` on an existing id updates verification fields only (re-verify), never the value —
 * a new value is a new version (ADR-0011 §3).
 */
export class DrizzlePolicyRepository implements PolicyRepository {
  constructor(private readonly db: Database) {}

  async findByKey(key: string): Promise<PolicyEntry[]> {
    const rows = await this.db.select().from(policyEntries).where(eq(policyEntries.key, key));
    return rows.map(toEntry);
  }

  async listEffective(): Promise<PolicyEntry[]> {
    const rows = await this.db.select().from(policyEntries);
    return rows.map(toEntry);
  }

  async save(entry: PolicyEntry): Promise<void> {
    await this.db
      .insert(policyEntries)
      .values(toRow(entry))
      .onConflictDoUpdate({
        target: policyEntries.id,
        set: {
          verifiedAt: entry.verifiedAt,
          verifiedBy: entry.verifiedBy,
          sourceUrl: entry.sourceUrl,
          maxAgeDays: entry.maxAgeDays,
          notes: entry.notes,
        },
      });
  }

  /** Inserts seed rows whose (key, scope, scopeId, version) is not present yet; returns the count. */
  async seedIfMissing(entries: readonly PolicyEntry[]): Promise<number> {
    if (entries.length === 0) return 0;
    const inserted = await this.db
      .insert(policyEntries)
      .values(entries.map(toRow))
      .onConflictDoNothing()
      .returning({ id: policyEntries.id });
    return inserted.length;
  }
}

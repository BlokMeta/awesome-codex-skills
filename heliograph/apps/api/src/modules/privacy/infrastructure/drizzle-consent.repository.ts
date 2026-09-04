import type { ConsentRepository, LegalDocument, StoredConsent } from '@heliograph/domain';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import { withoutTenant } from '../../../db/tenant.js';
import { consentRecords } from './schema.js';

/** Consents are personal records (no workspace); every read/write is keyed by operator id. */
export class DrizzleConsentRepository implements ConsentRepository {
  constructor(private readonly db: Database) {}

  listForOperator(operatorId: string): Promise<StoredConsent[]> {
    return withoutTenant(this.db, 'consent records of the operator', async (tx) => {
      const rows = await tx
        .select()
        .from(consentRecords)
        .where(eq(consentRecords.operatorId, operatorId));
      return rows.map((r) => ({
        id: r.id,
        operatorId: r.operatorId,
        document: r.document,
        version: r.version,
        acceptedAt: r.acceptedAt,
        withdrawnAt: r.withdrawnAt,
        ip: r.ip,
        userAgent: r.userAgent,
      }));
    });
  }

  append(records: readonly Omit<StoredConsent, 'withdrawnAt'>[]): Promise<void> {
    if (records.length === 0) return Promise.resolve();
    return withoutTenant(this.db, 'record consent', async (tx) => {
      await tx.insert(consentRecords).values(
        records.map((r) => ({
          id: r.id,
          operatorId: r.operatorId,
          document: r.document,
          version: r.version,
          acceptedAt: r.acceptedAt,
          ip: r.ip,
          userAgent: r.userAgent,
        })),
      );
    });
  }

  withdraw(operatorId: string, document: LegalDocument, at: Date): Promise<void> {
    return withoutTenant(this.db, 'withdraw consent', async (tx) => {
      await tx
        .update(consentRecords)
        .set({ withdrawnAt: at })
        .where(
          and(
            eq(consentRecords.operatorId, operatorId),
            eq(consentRecords.document, document),
            isNull(consentRecords.withdrawnAt),
          ),
        );
    });
  }
}

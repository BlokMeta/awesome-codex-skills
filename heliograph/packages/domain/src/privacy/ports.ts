import type { ConsentRecord, LegalDocument } from './consent.js';

export interface StoredConsent extends ConsentRecord {
  readonly id: string;
  readonly operatorId: string;
  readonly ip: string | null;
  readonly userAgent: string | null;
}

export interface ConsentRepository {
  listForOperator(operatorId: string): Promise<StoredConsent[]>;
  append(records: readonly Omit<StoredConsent, 'withdrawnAt'>[]): Promise<void>;
  withdraw(operatorId: string, document: LegalDocument, at: Date): Promise<void>;
}

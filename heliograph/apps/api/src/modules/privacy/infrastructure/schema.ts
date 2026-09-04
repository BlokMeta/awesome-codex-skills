import { sql } from 'drizzle-orm';
import { index, pgEnum, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * privacy tables (docs/11 §12d). Consents are personal (operator-scoped) and therefore carry no
 * workspace_id; erasure requests may target a workspace, an operator or a channel.
 */
export const legalDocumentEnum = pgEnum('legal_document', [
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
export const erasureSourceEnum = pgEnum('erasure_source', ['user', 'meta_callback', 'support']);

export const consentRecords = pgTable(
  'consent_records',
  {
    id: text('id').primaryKey(),
    operatorId: text('operator_id').notNull(),
    document: legalDocumentEnum('document').notNull(),
    version: text('version').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull(),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    ip: text('ip'),
    userAgent: text('user_agent'),
  },
  (t) => [index('consent_records_operator_idx').on(t.operatorId, t.document)],
);

export const erasureRequests = pgTable(
  'erasure_requests',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id'),
    operatorId: text('operator_id'),
    channelId: text('channel_id'),
    source: erasureSourceEnum('source').notNull(),
    confirmationCode: text('confirmation_code').notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('erasure_requests_due_idx').on(t.completedAt, t.dueAt),
    pgPolicy('erasure_requests_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'hg_app',
      using: sql`workspace_id IS NULL OR workspace_id = current_setting('hg.workspace_id', true)`,
      withCheck: sql`workspace_id IS NULL OR workspace_id = current_setting('hg.workspace_id', true)`,
    }),
  ],
).enableRLS();

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * config tables (ADR-0011, docs/11 §12b). Global and platform entries are visible to every
 * tenant; workspace-scoped overrides are visible only inside that workspace's transaction.
 */
export const policyScopeEnum = pgEnum('policy_scope', ['global', 'platform', 'workspace']);

export const policyEntries = pgTable(
  'policy_entries',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull(),
    scope: policyScopeEnum('scope').notNull(),
    scopeId: text('scope_id'),
    value: jsonb('value').notNull(),
    version: integer('version').notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull(),
    verifiedBy: text('verified_by').notNull(),
    sourceUrl: text('source_url'),
    maxAgeDays: integer('max_age_days').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('policy_entries_target_version_unique').on(
      t.key,
      t.scope,
      sql`coalesce(${t.scopeId}, '')`,
      t.version,
    ),
    index('policy_entries_key_idx').on(t.key),
    pgPolicy('policy_entries_scope_visibility', {
      as: 'permissive',
      for: 'all',
      to: 'hg_app',
      using: sql`scope <> 'workspace' OR scope_id = current_setting('hg.workspace_id', true)`,
      withCheck: sql`scope <> 'workspace' OR scope_id = current_setting('hg.workspace_id', true)`,
    }),
  ],
).enableRLS();

export const featureFlags = pgTable('feature_flags', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  description: text('description').notNull().default(''),
  defaultOn: boolean('default_on').notNull().default(false),
  rules: jsonb('rules').notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

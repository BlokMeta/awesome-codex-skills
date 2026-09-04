import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** persona tables (docs/11 §2). Profiles are JSONB validated by the domain Zod schemas. */
export const personaStatusEnum = pgEnum('persona_status', [
  'draft',
  'warming',
  'active',
  'paused',
  'archived',
]);
export const personaNicheEnum = pgEnum('persona_niche', ['devops', 'ai', 'both', 'personal']);

const tenantRls = (table: string) => [
  pgPolicy(`${table}_tenant_isolation`, {
    as: 'permissive',
    for: 'all',
    to: 'hg_app',
    using: sql`workspace_id = current_setting('hg.workspace_id', true)`,
    withCheck: sql`workspace_id = current_setting('hg.workspace_id', true)`,
  }),
];

export const personas = pgTable(
  'personas',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    niche: personaNicheEnum('niche').notNull(),
    language: text('language').notNull(),
    timezone: text('timezone').notNull(),
    voiceBible: jsonb('voice_bible').notNull(),
    visualKit: jsonb('visual_kit').notNull(),
    topicProfile: jsonb('topic_profile').notNull(),
    postingPolicy: jsonb('posting_policy').notNull(),
    engagementPolicy: jsonb('engagement_policy').notNull(),
    qualityPolicy: jsonb('quality_policy').notNull(),
    status: personaStatusEnum('status').notNull().default('draft'),
    warmupStartedAt: timestamp('warmup_started_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('personas_workspace_slug_unique').on(t.workspaceId, t.slug),
    index('personas_workspace_created_idx').on(t.workspaceId, t.createdAt, t.id),
    ...tenantRls('personas'),
  ],
).enableRLS();

export const personaVersions = pgTable(
  'persona_versions',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    personaId: text('persona_id')
      .notNull()
      .references(() => personas.id, { onDelete: 'cascade' }),
    snapshot: jsonb('snapshot').notNull(),
    changedBy: text('changed_by').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('persona_versions_persona_idx').on(t.personaId, t.createdAt),
    ...tenantRls('persona_versions'),
  ],
).enableRLS();

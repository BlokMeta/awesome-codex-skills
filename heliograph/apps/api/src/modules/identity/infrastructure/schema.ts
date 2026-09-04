import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * identity tables (docs/11 §1, §12a). `operators` carries the columns better-auth expects
 * (email, email_verified, name, image) so the auth plugin (M0.8) maps onto it without a second
 * user table. Tenant-scoped tables enable RLS: see src/db/tenant.ts for how `hg.workspace_id`
 * and the `hg_app` role are set per transaction.
 */
export const roleEnum = pgEnum('membership_role', ['owner', 'admin', 'editor', 'viewer']);

const tenantRls = (table: string) => [
  pgPolicy(`${table}_tenant_isolation`, {
    as: 'permissive',
    for: 'all',
    to: 'hg_app',
    using: sql`workspace_id = current_setting('hg.workspace_id', true)`,
    withCheck: sql`workspace_id = current_setting('hg.workspace_id', true)`,
  }),
];

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  locale: text('locale').notNull().default('tr'),
  timezone: text('timezone').notNull().default('Europe/Istanbul'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const operators = pgTable(
  'operators',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name').notNull().default(''),
    image: text('image'),
    locale: text('locale').notNull().default('tr'),
    timezone: text('timezone').notNull().default('Europe/Istanbul'),
    isSuperadmin: boolean('is_superadmin').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('operators_email_unique').on(sql`lower(${t.email})`)],
);

export const memberships = pgTable(
  'memberships',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    operatorId: text('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    invitedBy: text('invited_by').references(() => operators.id, { onDelete: 'set null' }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('memberships_operator_workspace_unique').on(t.operatorId, t.workspaceId),
    index('memberships_workspace_idx').on(t.workspaceId),
    ...tenantRls('memberships'),
  ],
).enableRLS();

export const invitations = pgTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: roleEnum('role').notNull(),
    tokenHash: text('token_hash').notNull(),
    invitedBy: text('invited_by').references(() => operators.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('invitations_token_hash_unique').on(t.tokenHash),
    index('invitations_workspace_idx').on(t.workspaceId),
    ...tenantRls('invitations'),
  ],
).enableRLS();

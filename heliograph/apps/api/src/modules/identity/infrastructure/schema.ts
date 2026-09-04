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
 * identity tables (docs/11 §1, §12a). Property names equal the better-auth field names so the
 * Drizzle adapter maps models by `modelName` only (ADR-0007): user→operators, session→sessions,
 * account→auth_accounts, verification→verifications, organization→workspaces, member→memberships,
 * invitation→invitations, passkey→passkeys, twoFactor→two_factors. Column names stay snake_case.
 * Tenant-scoped tables enable RLS; see src/db/tenant.ts.
 */
export const roleEnum = pgEnum('membership_role', ['owner', 'admin', 'editor', 'viewer']);
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'rejected',
  'canceled',
]);

const tenantRls = (table: string) => [
  pgPolicy(`${table}_tenant_isolation`, {
    as: 'permissive',
    for: 'all',
    to: 'hg_app',
    using: sql`workspace_id = current_setting('hg.workspace_id', true)`,
    withCheck: sql`workspace_id = current_setting('hg.workspace_id', true)`,
  }),
];

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const workspaces = pgTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    logo: text('logo'),
    metadata: jsonb('metadata'),
    locale: text('locale').notNull().default('tr'),
    timezone: text('timezone').notNull().default('Europe/Istanbul'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('workspaces_slug_unique').on(t.slug)],
);

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
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    isSuperadmin: boolean('is_superadmin').notNull().default(false),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('operators_email_unique').on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    operatorId: text('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    activeWorkspaceId: text('active_workspace_id'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('sessions_token_unique').on(t.token),
    index('sessions_operator_idx').on(t.operatorId),
  ],
);

/** Credential and OAuth identities of an operator (better-auth `account`). */
export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: text('id').primaryKey(),
    operatorId: text('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('auth_accounts_issuer_account_unique').on(t.issuer, t.accountId),
    index('auth_accounts_operator_idx').on(t.operatorId),
  ],
);

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
);

export const passkeys = pgTable(
  'passkeys',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    operatorId: text('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    aaguid: text('aaguid'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('passkeys_credential_id_unique').on(t.credentialID),
    index('passkeys_operator_idx').on(t.operatorId),
  ],
);

export const twoFactors = pgTable(
  'two_factors',
  {
    id: text('id').primaryKey(),
    operatorId: text('operator_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    verified: boolean('verified').notNull().default(true),
    failedVerificationCount: integer('failed_verification_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
  },
  (t) => [index('two_factors_operator_idx').on(t.operatorId)],
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
    ...timestamps,
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
    status: invitationStatusEnum('status').notNull().default('pending'),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => operators.id, { onDelete: 'cascade' }),
    teamId: text('team_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('invitations_workspace_idx').on(t.workspaceId),
    index('invitations_email_idx').on(t.email),
    ...tenantRls('invitations'),
  ],
).enableRLS();

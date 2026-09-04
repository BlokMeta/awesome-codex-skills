import { sql } from 'drizzle-orm';
import {
  customType,
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

/** channel tables (docs/11 §3). Credentials hold ciphertext only (envelope.ts). */
export const platformEnum = pgEnum('platform', [
  'instagram',
  'threads',
  'x',
  'youtube',
  'tiktok',
  'telegram',
]);
export const channelHealthEnum = pgEnum('channel_health', [
  'ok',
  'token_expiring',
  'token_expired',
  'rate_limited',
  'restricted',
  'banned',
]);

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array | string }>({
  dataType: () => 'bytea',
  toDriver: (value) => value,
  fromDriver: (value) => {
    if (Buffer.isBuffer(value)) return value;
    if (typeof value === 'string') return Buffer.from(value.replace(/^\\x/, ''), 'hex');
    return Buffer.from(value);
  },
});

const tenantRls = (table: string) => [
  pgPolicy(`${table}_tenant_isolation`, {
    as: 'permissive',
    for: 'all',
    to: 'hg_app',
    using: sql`workspace_id = current_setting('hg.workspace_id', true)`,
    withCheck: sql`workspace_id = current_setting('hg.workspace_id', true)`,
  }),
];

export const credentials = pgTable(
  'credentials',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    kind: text('kind').notNull(),
    ciphertext: bytea('ciphertext').notNull(),
    wrappedDek: bytea('wrapped_dek').notNull(),
    keyVersion: integer('key_version').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('credentials_workspace_idx').on(t.workspaceId), ...tenantRls('credentials')],
).enableRLS();

export const channels = pgTable(
  'channels',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    personaId: text('persona_id'),
    platform: platformEnum('platform').notNull(),
    externalAccountId: text('external_account_id').notNull(),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull().default(''),
    credentialId: text('credential_id')
      .notNull()
      .references(() => credentials.id),
    scopes: jsonb('scopes').notNull().default(sql`'[]'::jsonb`),
    capabilities: jsonb('capabilities').notNull(),
    health: channelHealthEnum('health').notNull().default('ok'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastError: jsonb('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('channels_platform_account_unique').on(t.platform, t.externalAccountId),
    index('channels_workspace_created_idx').on(t.workspaceId, t.createdAt, t.id),
    index('channels_persona_idx').on(t.personaId),
    ...tenantRls('channels'),
  ],
).enableRLS();

/** Pending OAuth handshakes; short-lived, consumed once by the public callback. */
export const oauthStates = pgTable(
  'oauth_states',
  {
    state: text('state').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    operatorId: text('operator_id').notNull(),
    platform: platformEnum('platform').notNull(),
    personaId: text('persona_id'),
    codeVerifier: text('code_verifier'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('oauth_states_expires_idx').on(t.expiresAt), ...tenantRls('oauth_states')],
).enableRLS();

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** billing tables (docs/11 §12c). Plans are global; everything else is tenant-scoped (RLS). */
export const planIntervalEnum = pgEnum('plan_interval', ['month', 'year']);
export const subscriptionProviderEnum = pgEnum('subscription_provider', [
  'paddle',
  'polar',
  'iyzico',
  'apple',
  'google',
  'manual',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
  'expired',
]);
export const creditReasonEnum = pgEnum('credit_reason', [
  'plan_grant',
  'purchase',
  'usage',
  'refund',
  'bonus',
  'expiry',
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

export const plans = pgTable(
  'plans',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    interval: planIntervalEnum('interval').notNull(),
    priceMinor: integer('price_minor').notNull(),
    currency: text('currency').notNull().default('USD'),
    active: boolean('active').notNull().default(true),
    public: boolean('public').notNull().default(true),
    sort: integer('sort').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('plans_code_unique').on(t.code)],
);

export const planEntitlements = pgTable(
  'plan_entitlements',
  {
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    feature: text('feature').notNull(),
    /** NULL = unlimited, 0 = disabled */
    limitValue: numeric('limit_value', { precision: 12, scale: 2 }),
  },
  (t) => [primaryKey({ columns: [t.planId, t.feature] })],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    provider: subscriptionProviderEnum('provider').notNull(),
    providerRef: text('provider_ref'),
    status: subscriptionStatusEnum('status').notNull(),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    seats: integer('seats').notNull().default(1),
    extraAccounts: integer('extra_accounts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('subscriptions_workspace_created_idx').on(t.workspaceId, t.createdAt),
    ...tenantRls('subscriptions'),
  ],
).enableRLS();

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    delta: integer('delta').notNull(),
    reason: creditReasonEnum('reason').notNull(),
    refType: text('ref_type'),
    refId: text('ref_id'),
    balanceAfter: integer('balance_after').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('credit_ledger_workspace_at_idx').on(t.workspaceId, t.at, t.id),
    ...tenantRls('credit_ledger'),
  ],
).enableRLS();

export const usageRecords = pgTable(
  'usage_records',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    feature: text('feature'),
    module: text('module').notNull(),
    provider: text('provider'),
    model: text('model'),
    unit: text('unit').notNull(),
    quantity: numeric('quantity', { precision: 14, scale: 4 }).notNull(),
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
    refType: text('ref_type'),
    refId: text('ref_id'),
    at: timestamp('at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('usage_records_workspace_feature_at_idx').on(t.workspaceId, t.feature, t.at),
    ...tenantRls('usage_records'),
  ],
).enableRLS();

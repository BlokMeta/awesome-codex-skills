import type { CreditEntry, Entitlement, Feature } from './entitlement.js';

/**
 * How each feature is measured (docs/15 §3.2). `count` = current number of things the caller
 * owns (accounts, personas, members); `daily` / `monthly` = consumption summed from usage records;
 * `flag` = on (limit null) or off (limit 0).
 */
export const FEATURE_KIND: Readonly<Record<Feature, 'count' | 'daily' | 'monthly' | 'flag'>> = {
  connected_accounts: 'count',
  personas: 'count',
  team_members: 'count',
  daily_posts: 'daily',
  daily_videos: 'daily',
  ai_credits_month: 'monthly',
  manual_library: 'flag',
  video_pipeline: 'flag',
  voice_clone: 'flag',
  crm: 'flag',
  api_access: 'flag',
  white_label: 'flag',
};

export type PlanInterval = 'month' | 'year';

export interface Plan {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly interval: PlanInterval;
  readonly priceMinor: number;
  readonly currency: string;
  readonly active: boolean;
  readonly public: boolean;
  readonly sort: number;
}

export type SubscriptionProvider = 'paddle' | 'polar' | 'iyzico' | 'apple' | 'google' | 'manual';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'expired';

/** Statuses under which the plan's entitlements still apply. */
export const ENTITLED_STATUSES: readonly SubscriptionStatus[] = ['trialing', 'active', 'past_due'];

export interface Subscription {
  readonly id: string;
  readonly workspaceId: string;
  readonly planId: string;
  readonly provider: SubscriptionProvider;
  readonly providerRef: string | null;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEndsAt: Date | null;
  readonly seats: number;
  readonly extraAccounts: number;
}

export interface UsageRecord {
  readonly id: string;
  readonly workspaceId: string;
  /** Which entitlement this consumption counts against; null for pure cost bookkeeping. */
  readonly feature: Feature | null;
  readonly module: string;
  readonly provider: string | null;
  readonly model: string | null;
  readonly unit: string;
  readonly quantity: number;
  readonly costUsd: number;
  readonly refType: string | null;
  readonly refId: string | null;
  readonly at: Date;
}

export interface PlanRepository {
  findByCode(code: string): Promise<Plan | null>;
  findById(id: string): Promise<Plan | null>;
  listPublic(): Promise<Plan[]>;
  entitlements(planId: string): Promise<Entitlement[]>;
  /** Seed/admin: insert or update the plan (by code) and replace its entitlements. */
  upsert(
    plan: Omit<Plan, 'id'> & { id?: string },
    entitlements: readonly Entitlement[],
  ): Promise<void>;
}

export interface SubscriptionRepository {
  /** The newest subscription of the workspace, whatever its status. */
  findLatest(workspaceId: string): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
}

export interface UsageRepository {
  record(usage: UsageRecord): Promise<void>;
  usedInWindow(workspaceId: string, feature: Feature, from: Date, to: Date): Promise<number>;
}

export interface CreditLedgerRepository {
  balance(workspaceId: string): Promise<number>;
  /** Appends the entry with a computed `balance_after`; returns the new balance. */
  append(
    workspaceId: string,
    entry: CreditEntry & { refType?: string | null; refId?: string | null },
  ): Promise<number>;
}

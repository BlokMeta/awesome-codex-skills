import {
  assertEntitlement,
  type Clock,
  type ConfigReader,
  type CreditLedgerRepository,
  creditWarningLevel,
  type DomainError,
  domainError,
  ENTITLED_STATUSES,
  type Entitlement,
  type EntitlementCheck,
  type Entitlements,
  err,
  FEATURE_KIND,
  type Feature,
  FeatureSchema,
  type Plan,
  type PlanRepository,
  type Result,
  type Subscription,
  type SubscriptionRepository,
  toEntitlements,
  type UsageRepository,
} from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import {
  CLOCK,
  CONFIG_READER,
  CREDIT_LEDGER_REPOSITORY,
  PLAN_REPOSITORY,
  SUBSCRIPTION_REPOSITORY,
  USAGE_REPOSITORY,
} from '../../../shared/tokens.js';

const FALLBACK_PLAN_CODE = 'free';

interface ResolvedPlan {
  readonly plan: Plan;
  readonly subscription: Subscription | null;
  readonly entitlements: Entitlements;
  readonly list: Entitlement[];
}

interface EntitlementLine {
  readonly feature: Feature;
  readonly kind: (typeof FEATURE_KIND)[Feature];
  readonly limit: number | null;
  readonly used: number | null;
  readonly remaining: number | null;
}

const DAY_MS = 86_400_000;

/**
 * Single source of truth for "may this workspace do X?" (ADR-0012, rule 14). Resolves the
 * workspace's plan (entitled subscription, else the Free plan), measures consumption from usage
 * records and delegates the decision to the domain `assertEntitlement`.
 */
@Injectable()
export class EntitlementService {
  constructor(
    @Inject(PLAN_REPOSITORY) private readonly plans: PlanRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(USAGE_REPOSITORY) private readonly usage: UsageRepository,
    @Inject(CREDIT_LEDGER_REPOSITORY) private readonly credits: CreditLedgerRepository,
    @Inject(CONFIG_READER) private readonly config: ConfigReader,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async resolve(workspaceId: string): Promise<ResolvedPlan> {
    const latest = await this.subscriptions.findLatest(workspaceId);
    const entitled = latest && ENTITLED_STATUSES.includes(latest.status) ? latest : null;
    const plan =
      (entitled ? await this.plans.findById(entitled.planId) : null) ??
      (await this.plans.findByCode(FALLBACK_PLAN_CODE));
    if (!plan) throw new Error(`plan catalogue missing '${FALLBACK_PLAN_CODE}' — run db:seed`);
    const list = await this.plans.entitlements(plan.id);
    return { plan, subscription: entitled, entitlements: toEntitlements(list), list };
  }

  /**
   * `currentCount` is required for count-type features (the calling module owns the table);
   * daily/monthly consumption is read from usage records.
   */
  async assert(
    workspaceId: string,
    feature: Feature,
    opts: { requested?: number; currentCount?: number } = {},
  ): Promise<Result<EntitlementCheck, DomainError>> {
    const resolved = await this.resolve(workspaceId);
    const kind = FEATURE_KIND[feature];
    if (kind === 'count' && opts.currentCount === undefined) {
      return err(
        domainError('billing.count_required', 'errors.billing.countRequired', { feature }),
      );
    }
    const used = await this.used(workspaceId, feature, resolved.subscription, opts.currentCount);
    const requested = kind === 'flag' ? 0 : (opts.requested ?? 1);
    return assertEntitlement(resolved.entitlements, feature, used, requested);
  }

  async overview(workspaceId: string): Promise<{
    resolved: ResolvedPlan;
    lines: EntitlementLine[];
    credits: { balance: number; monthlyGrant: number; warning: 'ok' | 'warning' | 'exhausted' };
  }> {
    const resolved = await this.resolve(workspaceId);
    const lines: EntitlementLine[] = [];
    for (const feature of FeatureSchema.options) {
      if (!resolved.entitlements.has(feature)) continue;
      const kind = FEATURE_KIND[feature];
      const limit = resolved.entitlements.get(feature) ?? null;
      const used =
        kind === 'daily' || kind === 'monthly'
          ? await this.used(workspaceId, feature, resolved.subscription)
          : null;
      const remaining = limit === null || used === null ? null : Math.max(0, limit - used);
      lines.push({ feature, kind, limit, used, remaining });
    }
    const balance = await this.credits.balance(workspaceId);
    const monthlyGrant = resolved.entitlements.get('ai_credits_month') ?? 0;
    const warnRatio = await this.config.get('billing.credit_warn_ratio', Number);
    return {
      resolved,
      lines,
      credits: {
        balance,
        monthlyGrant,
        warning: creditWarningLevel(balance, monthlyGrant, warnRatio),
      },
    };
  }

  private async used(
    workspaceId: string,
    feature: Feature,
    subscription: Subscription | null,
    currentCount?: number,
  ): Promise<number> {
    const kind = FEATURE_KIND[feature];
    const now = this.clock.now();
    if (kind === 'count') return currentCount ?? 0;
    if (kind === 'flag') return 0;
    if (kind === 'daily') {
      const start = new Date(Math.floor(now.getTime() / DAY_MS) * DAY_MS);
      return this.usage.usedInWindow(
        workspaceId,
        feature,
        start,
        new Date(start.getTime() + DAY_MS),
      );
    }
    const from =
      subscription?.currentPeriodStart ??
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to =
      subscription?.currentPeriodEnd ??
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return this.usage.usedInWindow(workspaceId, feature, from, to);
  }
}

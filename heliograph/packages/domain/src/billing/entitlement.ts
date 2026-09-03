import { z } from 'zod';
import { type DomainError, domainError } from '../shared/domain-error.js';
import { err, ok, type Result } from '../shared/result.js';

/**
 * Plan entitlements (ADR-0012, CLAUDE.md rule 14). Every costly use-case calls
 * `assertEntitlement` BEFORE doing work and records usage AFTER.
 */
export const FeatureSchema = z.enum([
  'connected_accounts',
  'personas',
  'daily_posts',
  'daily_videos',
  'ai_credits_month',
  'team_members',
  'manual_library',
  'video_pipeline',
  'voice_clone',
  'crm',
  'api_access',
  'white_label',
]);
export type Feature = z.infer<typeof FeatureSchema>;

/** `limit` null = unlimited; 0 = feature disabled. */
export const EntitlementSchema = z.object({
  feature: FeatureSchema,
  limit: z.number().nonnegative().nullable(),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

export type Entitlements = ReadonlyMap<Feature, number | null>;

export const toEntitlements = (list: readonly Entitlement[]): Entitlements =>
  new Map(list.map((e) => [e.feature, e.limit]));

export interface EntitlementCheck {
  readonly feature: Feature;
  readonly limit: number | null;
  readonly used: number;
  readonly requested: number;
  readonly remainingAfter: number | null;
}

export function assertEntitlement(
  entitlements: Entitlements,
  feature: Feature,
  used: number,
  requested = 1,
): Result<EntitlementCheck, DomainError> {
  if (!entitlements.has(feature)) {
    return err(
      domainError('billing.feature_not_in_plan', 'errors.billing.featureNotInPlan', { feature }),
    );
  }
  const limit = entitlements.get(feature) ?? null;
  if (limit === null) {
    return ok({ feature, limit, used, requested, remainingAfter: null });
  }
  if (limit === 0) {
    return err(
      domainError('billing.feature_disabled', 'errors.billing.featureDisabled', { feature }),
    );
  }
  if (used + requested > limit) {
    return err(
      domainError('billing.entitlement_exceeded', 'errors.billing.entitlementExceeded', {
        feature,
        limit,
        used,
        requested,
      }),
    );
  }
  return ok({ feature, limit, used, requested, remainingAfter: limit - used - requested });
}

/** Credit ledger: append-only deltas; balance is the running sum. */
export const CreditReasonSchema = z.enum([
  'plan_grant',
  'purchase',
  'usage',
  'refund',
  'bonus',
  'expiry',
]);
export type CreditReason = z.infer<typeof CreditReasonSchema>;

export interface CreditEntry {
  readonly delta: number;
  readonly reason: CreditReason;
  readonly at: Date;
}

export const creditBalance = (ledger: readonly CreditEntry[]): number =>
  ledger.reduce((sum, e) => sum + e.delta, 0);

/**
 * Spend credits: fails when the balance is insufficient. `softBrakeRatio` is the share of the
 * monthly grant at which the UI warns (docs/15 §4: 80%).
 */
export function spendCredits(
  ledger: readonly CreditEntry[],
  amount: number,
  now: Date,
): Result<{ entry: CreditEntry; balanceAfter: number }, DomainError> {
  if (amount <= 0 || !Number.isInteger(amount)) {
    return err(domainError('billing.invalid_amount', 'errors.billing.invalidAmount', { amount }));
  }
  const balance = creditBalance(ledger);
  if (balance < amount) {
    return err(
      domainError('billing.insufficient_credits', 'errors.billing.insufficientCredits', {
        balance,
        amount,
      }),
    );
  }
  return ok({
    entry: { delta: -amount, reason: 'usage', at: now },
    balanceAfter: balance - amount,
  });
}

export function creditWarningLevel(
  balance: number,
  monthlyGrant: number,
  warnAtRatio = 0.8,
): 'ok' | 'warning' | 'exhausted' {
  if (balance <= 0) return 'exhausted';
  if (monthlyGrant > 0 && monthlyGrant - balance >= monthlyGrant * warnAtRatio) return 'warning';
  return 'ok';
}

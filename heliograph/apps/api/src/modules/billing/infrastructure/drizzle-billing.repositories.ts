import {
  type CreditEntry,
  type CreditLedgerRepository,
  type Entitlement,
  EntitlementSchema,
  type Feature,
  type Plan,
  type PlanRepository,
  type Subscription,
  type SubscriptionRepository,
  type UsageRecord,
  type UsageRepository,
} from '@heliograph/domain';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../../../db/client.js';
import { withoutTenant, withWorkspace } from '../../../db/tenant.js';
import { creditLedger, planEntitlements, plans, subscriptions, usageRecords } from './schema.js';

const toPlan = (r: typeof plans.$inferSelect): Plan => ({
  id: r.id,
  code: r.code,
  name: r.name,
  interval: r.interval,
  priceMinor: r.priceMinor,
  currency: r.currency,
  active: r.active,
  public: r.public,
  sort: r.sort,
});

/** Plans are a global catalogue: no tenant context, readable by every workspace. */
export class DrizzlePlanRepository implements PlanRepository {
  constructor(private readonly db: Database) {}

  findByCode(code: string): Promise<Plan | null> {
    return withoutTenant(this.db, 'plan catalogue', async (tx) => {
      const [row] = await tx.select().from(plans).where(eq(plans.code, code)).limit(1);
      return row ? toPlan(row) : null;
    });
  }

  findById(id: string): Promise<Plan | null> {
    return withoutTenant(this.db, 'plan catalogue', async (tx) => {
      const [row] = await tx.select().from(plans).where(eq(plans.id, id)).limit(1);
      return row ? toPlan(row) : null;
    });
  }

  listPublic(): Promise<Plan[]> {
    return withoutTenant(this.db, 'plan catalogue', async (tx) => {
      const rows = await tx
        .select()
        .from(plans)
        .where(and(eq(plans.public, true), eq(plans.active, true)))
        .orderBy(plans.sort);
      return rows.map(toPlan);
    });
  }

  entitlements(planId: string): Promise<Entitlement[]> {
    return withoutTenant(this.db, 'plan catalogue', async (tx) => {
      const rows = await tx
        .select()
        .from(planEntitlements)
        .where(eq(planEntitlements.planId, planId));
      return rows.map((r) =>
        EntitlementSchema.parse({
          feature: r.feature,
          limit: r.limitValue === null ? null : Number(r.limitValue),
        }),
      );
    });
  }

  upsert(plan: Omit<Plan, 'id'> & { id?: string }, entitlements: readonly Entitlement[]) {
    return withoutTenant(this.db, 'plan catalogue seed/admin', async (tx) => {
      const [existing] = await tx.select().from(plans).where(eq(plans.code, plan.code)).limit(1);
      const id = existing?.id ?? plan.id ?? ulid();
      const values = {
        id,
        code: plan.code,
        name: plan.name,
        interval: plan.interval,
        priceMinor: plan.priceMinor,
        currency: plan.currency,
        active: plan.active,
        public: plan.public,
        sort: plan.sort,
      };
      await tx
        .insert(plans)
        .values(values)
        .onConflictDoUpdate({ target: plans.code, set: { ...values, updatedAt: new Date() } });
      await tx.delete(planEntitlements).where(eq(planEntitlements.planId, id));
      if (entitlements.length > 0) {
        await tx.insert(planEntitlements).values(
          entitlements.map((e) => ({
            planId: id,
            feature: e.feature,
            limitValue: e.limit === null ? null : String(e.limit),
          })),
        );
      }
    });
  }
}

const toSubscription = (r: typeof subscriptions.$inferSelect): Subscription => ({
  id: r.id,
  workspaceId: r.workspaceId,
  planId: r.planId,
  provider: r.provider,
  providerRef: r.providerRef,
  status: r.status,
  currentPeriodStart: r.currentPeriodStart,
  currentPeriodEnd: r.currentPeriodEnd,
  cancelAtPeriodEnd: r.cancelAtPeriodEnd,
  trialEndsAt: r.trialEndsAt,
  seats: r.seats,
  extraAccounts: r.extraAccounts,
});

export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: Database) {}

  findLatest(workspaceId: string): Promise<Subscription | null> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.workspaceId, workspaceId))
        .orderBy(desc(subscriptions.createdAt), desc(subscriptions.id))
        .limit(1);
      return row ? toSubscription(row) : null;
    });
  }

  save(s: Subscription): Promise<void> {
    return withWorkspace(this.db, s.workspaceId, async (tx) => {
      const values = {
        id: s.id,
        workspaceId: s.workspaceId,
        planId: s.planId,
        provider: s.provider,
        providerRef: s.providerRef,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        trialEndsAt: s.trialEndsAt,
        seats: s.seats,
        extraAccounts: s.extraAccounts,
      };
      await tx
        .insert(subscriptions)
        .values(values)
        .onConflictDoUpdate({
          target: subscriptions.id,
          set: { ...values, updatedAt: new Date() },
        });
    });
  }
}

export class DrizzleUsageRepository implements UsageRepository {
  constructor(private readonly db: Database) {}

  record(u: UsageRecord): Promise<void> {
    return withWorkspace(this.db, u.workspaceId, async (tx) => {
      await tx.insert(usageRecords).values({
        id: u.id,
        workspaceId: u.workspaceId,
        feature: u.feature,
        module: u.module,
        provider: u.provider,
        model: u.model,
        unit: u.unit,
        quantity: String(u.quantity),
        costUsd: String(u.costUsd),
        refType: u.refType,
        refId: u.refId,
        at: u.at,
      });
    });
  }

  usedInWindow(workspaceId: string, feature: Feature, from: Date, to: Date): Promise<number> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select({ total: sql<string>`coalesce(sum(${usageRecords.quantity}), 0)` })
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.workspaceId, workspaceId),
            eq(usageRecords.feature, feature),
            gte(usageRecords.at, from),
            lt(usageRecords.at, to),
          ),
        );
      return Number(row?.total ?? 0);
    });
  }
}

export class DrizzleCreditLedgerRepository implements CreditLedgerRepository {
  constructor(private readonly db: Database) {}

  balance(workspaceId: string): Promise<number> {
    return withWorkspace(this.db, workspaceId, (tx) => this.sum(tx, workspaceId));
  }

  append(
    workspaceId: string,
    entry: CreditEntry & { refType?: string | null; refId?: string | null },
  ): Promise<number> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      // Serialise concurrent appends per workspace so balance_after stays consistent.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${workspaceId}))`);
      const balanceAfter = (await this.sum(tx, workspaceId)) + entry.delta;
      await tx.insert(creditLedger).values({
        id: ulid(entry.at.getTime()),
        workspaceId,
        delta: entry.delta,
        reason: entry.reason,
        refType: entry.refType ?? null,
        refId: entry.refId ?? null,
        balanceAfter,
        at: entry.at,
      });
      return balanceAfter;
    });
  }

  private async sum(tx: Database, workspaceId: string): Promise<number> {
    const [row] = await tx
      .select({ total: sql<string>`coalesce(sum(${creditLedger.delta}), 0)` })
      .from(creditLedger)
      .where(eq(creditLedger.workspaceId, workspaceId));
    return Number(row?.total ?? 0);
  }
}

import { type Entitlement, EntitlementSchema } from '@heliograph/domain';
import { planSeed } from '@heliograph/seed';
import type { DrizzlePlanRepository } from './drizzle-billing.repositories.js';

/** Bootstraps the plan catalogue (docs/15 §3.2); idempotent, later edits happen in the panel. */
export async function seedPlans(repo: DrizzlePlanRepository): Promise<number> {
  for (const p of planSeed) {
    const entitlements: Entitlement[] = Object.entries(p.entitlements).map(([feature, limit]) =>
      EntitlementSchema.parse({ feature, limit }),
    );
    await repo.upsert(
      {
        code: p.code,
        name: p.name,
        interval: p.interval,
        priceMinor: p.priceMinor,
        currency: p.currency,
        active: true,
        public: p.public,
        sort: p.sort,
      },
      entitlements,
    );
  }
  return planSeed.length;
}

import { FeatureSchema } from '@heliograph/domain';
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const FeatureKindSchema = z.enum(['count', 'daily', 'monthly', 'flag']);
export const SubscriptionStatusSchema = z.enum([
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
  'expired',
]);

export const EntitlementLineSchema = z.object({
  feature: FeatureSchema,
  kind: FeatureKindSchema,
  /** null = unlimited; 0 = disabled */
  limit: z.number().nullable(),
  /** null for count/flag features (the owning module knows the count) */
  used: z.number().nullable(),
  remaining: z.number().nullable(),
});

export const EntitlementsResponseSchema = z.object({
  workspaceId: z.string(),
  plan: z.object({ code: z.string(), name: z.string() }),
  subscription: z
    .object({
      status: SubscriptionStatusSchema,
      currentPeriodEnd: z.string().datetime(),
      cancelAtPeriodEnd: z.boolean(),
      trialEndsAt: z.string().datetime().nullable(),
    })
    .nullable(),
  entitlements: z.array(EntitlementLineSchema),
  credits: z.object({
    balance: z.number().int(),
    monthlyGrant: z.number().int(),
    warning: z.enum(['ok', 'warning', 'exhausted']),
  }),
});
export type EntitlementsResponse = z.infer<typeof EntitlementsResponseSchema>;

/** Read model apps use to enable/disable features; the server re-checks before every costly job. */
export const entitlementsContract = oc
  .route({
    method: 'GET',
    path: '/v1/billing/entitlements',
    summary: 'Plan, entitlements and credit balance of the active workspace',
    tags: ['billing'],
  })
  .output(EntitlementsResponseSchema);

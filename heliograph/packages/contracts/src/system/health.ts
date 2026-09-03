import { oc } from '@orpc/contract';
import { z } from 'zod';

export const HealthStatusSchema = z.enum(['ok', 'degraded', 'down']);

export const DependencyHealthSchema = z.object({
  name: z.string(),
  status: HealthStatusSchema,
  latencyMs: z.number().int().nonnegative().optional(),
  detail: z.string().optional(),
});

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  version: z.string(),
  checkedAt: z.string().datetime(),
  dependencies: z.array(DependencyHealthSchema),
  /** ADR-0011: number of config keys whose verified_at exceeded max_age_days */
  staleConfigKeys: z.number().int().nonnegative(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const healthContract = oc
  .route({
    method: 'GET',
    path: '/v1/health',
    summary: 'Liveness + dependency health',
    tags: ['system'],
  })
  .output(HealthResponseSchema);

export const configHealthContract = oc
  .route({
    method: 'GET',
    path: '/v1/health/config',
    summary: 'Stale dynamic-config keys (ADR-0011)',
    tags: ['system'],
  })
  .output(
    z.object({
      checkedAt: z.string().datetime(),
      stale: z.array(
        z.object({
          key: z.string(),
          verifiedAt: z.string().datetime(),
          maxAgeDays: z.number().int(),
          overdueDays: z.number().int(),
        }),
      ),
    }),
  );

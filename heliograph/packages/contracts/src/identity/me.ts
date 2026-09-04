import { oc } from '@orpc/contract';
import { z } from 'zod';

export const RoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer']);

export const MeResponseSchema = z.object({
  operator: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    emailVerified: z.boolean(),
    locale: z.string(),
    timezone: z.string(),
    twoFactorEnabled: z.boolean(),
  }),
  workspaces: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      role: RoleSchema,
    }),
  ),
  /** The workspace the session is scoped to (better-auth active organization). */
  activeWorkspaceId: z.string().nullable(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

/**
 * Authenticated principal + workspace switcher data. Authentication endpoints themselves
 * (`/v1/auth/*`) are served by better-auth and documented in its own OpenAPI plugin (M1).
 */
export const meContract = oc
  .route({
    method: 'GET',
    path: '/v1/me',
    summary: 'Current operator, memberships and active workspace',
    tags: ['identity'],
  })
  .output(MeResponseSchema);

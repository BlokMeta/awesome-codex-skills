import { CapabilitiesSchema, ChannelHealthSchema, PlatformSchema } from '@heliograph/domain';
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { PageQuerySchema, pageOf } from '../common/pagination.js';

export const ChannelDtoSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  personaId: z.string().nullable(),
  platform: PlatformSchema,
  externalAccountId: z.string(),
  handle: z.string(),
  displayName: z.string(),
  scopes: z.array(z.string()),
  capabilities: CapabilitiesSchema,
  health: ChannelHealthSchema,
  tokenExpiresAt: z.string().datetime().nullable(),
  lastSyncAt: z.string().datetime().nullable(),
  lastError: z
    .object({ code: z.string(), message: z.string(), at: z.string().datetime() })
    .nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ChannelDto = z.infer<typeof ChannelDtoSchema>;

const byId = z.object({ id: z.string().min(1) });
const OAuthPlatformSchema = PlatformSchema.exclude(['telegram']);

/** Platforms this deployment can connect (client credentials configured, docs/14 A3–A7). */
export const platformsContract = oc
  .route({
    method: 'GET',
    path: '/v1/channels/platforms',
    summary: 'Connectable platforms',
    tags: ['channel'],
  })
  .output(z.object({ available: z.array(PlatformSchema) }));

export const listChannelsContract = oc
  .route({
    method: 'GET',
    path: '/v1/channels',
    summary: 'Connected channels of the active workspace',
    tags: ['channel'],
  })
  .input(PageQuerySchema.extend({ personaId: z.string().optional() }))
  .output(pageOf(ChannelDtoSchema));

export const getChannelContract = oc
  .route({ method: 'GET', path: '/v1/channels/{id}', summary: 'Channel detail', tags: ['channel'] })
  .input(byId)
  .output(ChannelDtoSchema);

export const startOAuthContract = oc
  .route({
    method: 'POST',
    path: '/v1/channels/oauth/{platform}/start',
    summary: 'Begin an OAuth connection; the browser is sent to `url`',
    tags: ['channel'],
  })
  .input(z.object({ platform: OAuthPlatformSchema, personaId: z.string().optional() }))
  .output(z.object({ url: z.string().url(), state: z.string() }));

export const connectTelegramContract = oc
  .route({
    method: 'POST',
    path: '/v1/channels/telegram',
    summary: 'Connect a Telegram bot by token (validated with getMe)',
    tags: ['channel'],
    successStatus: 201,
  })
  .input(z.object({ botToken: z.string().min(20).max(200), personaId: z.string().optional() }))
  .output(ChannelDtoSchema);

export const updateChannelContract = oc
  .route({
    method: 'PATCH',
    path: '/v1/channels/{id}',
    summary: 'Assign the channel to a persona (null = unassigned)',
    tags: ['channel'],
  })
  .input(byId.extend({ personaId: z.string().nullable() }))
  .output(ChannelDtoSchema);

export const testChannelContract = oc
  .route({
    method: 'POST',
    path: '/v1/channels/{id}/test',
    summary: 'Make a real read call with the stored credential',
    tags: ['channel'],
  })
  .input(byId)
  .output(
    z.object({
      ok: z.boolean(),
      handle: z.string().nullable(),
      health: ChannelHealthSchema,
      detail: z.string().nullable(),
    }),
  );

export const disconnectChannelContract = oc
  .route({
    method: 'DELETE',
    path: '/v1/channels/{id}',
    summary: 'Disconnect and destroy the stored credential',
    tags: ['channel'],
    successStatus: 204,
  })
  .input(byId)
  .output(z.void());

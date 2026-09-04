import { z } from 'zod';
import { type DomainError, domainError } from '../shared/domain-error.js';
import { IdSchema } from '../shared/id.js';
import { err, ok, type Result } from '../shared/result.js';

/** The six official platforms (rule 1); adding one = seed entries + an adapter, no schema change. */
export const PlatformSchema = z.enum([
  'instagram',
  'threads',
  'x',
  'youtube',
  'tiktok',
  'telegram',
]);
export type Platform = z.infer<typeof PlatformSchema>;

export const ChannelHealthSchema = z.enum([
  'ok',
  'token_expiring',
  'token_expired',
  'rate_limited',
  'restricted',
  'banned',
]);
export type ChannelHealth = z.infer<typeof ChannelHealthSchema>;

/** What the official API lets a third-party app do on this platform (config: `platform.capabilities`). */
export const CapabilitiesSchema = z
  .object({
    publish: z.array(z.string()).default([]),
    comments: z.string().default('none'),
    dm: z.string().default('none'),
    insights: z.union([z.boolean(), z.string()]).default(false),
  })
  .passthrough();
export type Capabilities = z.infer<typeof CapabilitiesSchema>;

export const ChannelSchema = z.object({
  id: IdSchema,
  workspaceId: IdSchema,
  personaId: IdSchema.nullable(),
  platform: PlatformSchema,
  externalAccountId: z.string().min(1),
  handle: z.string().min(1),
  displayName: z.string().default(''),
  credentialId: IdSchema,
  scopes: z.array(z.string()),
  capabilities: CapabilitiesSchema,
  health: ChannelHealthSchema,
  tokenExpiresAt: z.date().nullable(),
  lastSyncAt: z.date().nullable(),
  lastError: z.object({ code: z.string(), message: z.string(), at: z.date() }).nullable(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export interface ConnectedAccount {
  readonly externalAccountId: string;
  readonly handle: string;
  readonly displayName: string;
}

export interface NewChannelInput {
  readonly id: string;
  readonly workspaceId: string;
  readonly personaId: string | null;
  readonly platform: Platform;
  readonly credentialId: string;
  readonly scopes: readonly string[];
  readonly capabilities: Capabilities;
  readonly account: ConnectedAccount;
  readonly tokenExpiresAt: Date | null;
  readonly now: Date;
}

export function connectChannel(input: NewChannelInput): Result<Channel, DomainError> {
  const parsed = ChannelSchema.safeParse({
    id: input.id,
    workspaceId: input.workspaceId,
    personaId: input.personaId,
    platform: input.platform,
    externalAccountId: input.account.externalAccountId,
    handle: input.account.handle,
    displayName: input.account.displayName,
    credentialId: input.credentialId,
    scopes: [...input.scopes],
    capabilities: input.capabilities,
    health: 'ok',
    tokenExpiresAt: input.tokenExpiresAt,
    lastSyncAt: input.now,
    lastError: null,
  });
  return parsed.success
    ? ok(parsed.data)
    : err(
        domainError('channel.invalid', 'errors.channel.invalid', {
          issue: parsed.error.issues[0]?.path.join('.') ?? 'unknown',
        }),
      );
}

const HOUR_MS = 3_600_000;

/**
 * Health derived from token expiry (docs/08 §3: refresh 24 h before expiry, alarm on failure).
 * With a refresh token (`refreshable`) a short-lived access token is routine, not a warning:
 * X issues 2-hour tokens; only a failed refresh (recordFailure) degrades such a channel.
 */
export function healthFromExpiry(
  channel: Channel,
  now: Date,
  opts: { refreshable?: boolean } = {},
): ChannelHealth {
  if (channel.health === 'banned' || channel.health === 'restricted') return channel.health;
  if (!channel.tokenExpiresAt || opts.refreshable) {
    return channel.health === 'rate_limited' ? 'rate_limited' : 'ok';
  }
  const left = channel.tokenExpiresAt.getTime() - now.getTime();
  if (left <= 0) return 'token_expired';
  if (left <= 24 * HOUR_MS) return 'token_expiring';
  return channel.health === 'rate_limited' ? 'rate_limited' : 'ok';
}

export function recordFailure(
  channel: Channel,
  failure: { code: string; message: string; health?: ChannelHealth },
  now: Date,
): Channel {
  return {
    ...channel,
    health: failure.health ?? channel.health,
    lastError: { code: failure.code, message: failure.message, at: now },
  };
}

export function assignPersona(channel: Channel, personaId: string | null): Channel {
  return { ...channel, personaId };
}

/** A channel may publish `kind` only when the platform capability list contains it. */
export function canPublish(channel: Channel, kind: string): boolean {
  return channel.capabilities.publish.includes(kind);
}

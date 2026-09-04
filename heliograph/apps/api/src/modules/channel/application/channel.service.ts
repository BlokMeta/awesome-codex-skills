import { createHash, randomBytes } from 'node:crypto';
import {
  assignPersona,
  type BotTokenProvider,
  CapabilitiesSchema,
  type Channel,
  type ChannelRecord,
  type ChannelRepository,
  type Clock,
  type ConfigReader,
  type ConnectedAccount,
  type CredentialStore,
  connectChannel,
  type DomainError,
  domainError,
  err,
  healthFromExpiry,
  type OAuthProvider,
  type OAuthTokens,
  ok,
  type PersonaRepository,
  type Platform,
  type Result,
  recordFailure,
} from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import {
  BOT_TOKEN_PROVIDER,
  CHANNEL_REPOSITORY,
  CLOCK,
  CONFIG_READER,
  CREDENTIAL_STORE,
  OAUTH_PROVIDERS,
  OAUTH_STATE_REPOSITORY,
  PERSONA_REPOSITORY,
} from '../../../shared/tokens.js';
import { EntitlementService } from '../../billing/application/entitlement.service.js';
import { Authorizer } from '../../identity/application/authorizer.js';
import type { OAuthStateRepository } from './oauth-state.js';
import { ProviderHttpError, ProviderNotConfiguredError } from './provider-errors.js';

export interface Actor {
  readonly operatorId: string;
  readonly workspaceId: string;
}

interface ChannelUrls {
  /** Public API origin; OAuth callbacks live under it (docs/14 A3–A7 redirect URIs). */
  readonly apiUrl: string;
}

export const CHANNEL_URLS = Symbol('ChannelUrls');

export type OAuthPlatform = Exclude<Platform, 'telegram'>;
export type OAuthProviders = ReadonlyMap<
  OAuthPlatform,
  OAuthProvider & { isConfigured(): boolean }
>;

/** Stored credential payload for OAuth channels; Telegram stores the bare bot token. */
interface OAuthSecret {
  readonly accessToken: string;
  readonly refreshToken: string | null;
}

interface ChannelTestResult {
  readonly ok: boolean;
  readonly handle: string | null;
  readonly health: Channel['health'];
  readonly detail: string | null;
}

const STATE_TTL_MS = 10 * 60_000;

const base64url = (b: Buffer) => b.toString('base64url');
const notFound = (id: string) =>
  domainError('channel.not_found', 'errors.channel.notFound', { id });

/**
 * Channel use-cases (docs/08 §3, docs/12 M1.2). Mutations follow rule 14: authorize →
 * entitlement → provider call → domain rule → persist. Plaintext tokens exist only inside a
 * single call frame; they are never returned, logged or cached.
 */
@Injectable()
export class ChannelService {
  constructor(
    @Inject(CHANNEL_REPOSITORY) private readonly repo: ChannelRepository,
    @Inject(CREDENTIAL_STORE) private readonly credentials: CredentialStore,
    @Inject(OAUTH_STATE_REPOSITORY) private readonly states: OAuthStateRepository,
    @Inject(OAUTH_PROVIDERS) private readonly providers: OAuthProviders,
    @Inject(BOT_TOKEN_PROVIDER) private readonly telegram: BotTokenProvider,
    @Inject(PERSONA_REPOSITORY) private readonly personas: PersonaRepository,
    @Inject(Authorizer) private readonly authorizer: Authorizer,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(CONFIG_READER) private readonly config: ConfigReader,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CHANNEL_URLS) private readonly urls: ChannelUrls,
  ) {}

  async list(
    actor: Actor,
    opts: { limit: number; after?: { createdAt: Date; id: string }; personaId?: string },
  ): Promise<Result<{ items: ChannelRecord[]; hasMore: boolean }, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'workspace.read',
    );
    if (!auth.ok) return auth;
    return ok(await this.repo.list(actor.workspaceId, opts));
  }

  async get(actor: Actor, id: string): Promise<Result<ChannelRecord, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'workspace.read',
    );
    if (!auth.ok) return auth;
    return this.load(actor.workspaceId, id);
  }

  /** Which platforms this deployment can connect (client credentials present). */
  availablePlatforms(): Platform[] {
    const out: Platform[] = [];
    for (const [platform, provider] of this.providers)
      if (provider.isConfigured()) out.push(platform);
    out.push('telegram');
    return out;
  }

  redirectUri(platform: OAuthPlatform): string {
    return `${this.urls.apiUrl.replace(/\/$/, '')}/v1/channels/oauth/${platform}/callback`;
  }

  async startOAuth(
    actor: Actor,
    platform: OAuthPlatform,
    personaId: string | null,
  ): Promise<Result<{ url: string; state: string }, DomainError>> {
    const gate = await this.connectGate(actor, personaId);
    if (!gate.ok) return gate;
    // Don't send the operator to the provider when the plan is already full (re-checked in attach).
    const quota = await this.assertQuota(actor.workspaceId);
    if (!quota.ok) return quota;
    const provider = this.providers.get(platform);
    if (!provider?.isConfigured()) return err(this.notConfigured(platform));

    const state = base64url(randomBytes(32));
    const codeVerifier = provider.usesPkce ? base64url(randomBytes(48)) : null;
    const codeChallenge = codeVerifier
      ? base64url(createHash('sha256').update(codeVerifier).digest())
      : null;
    const now = this.clock.now();
    await this.states.create({
      state,
      workspaceId: actor.workspaceId,
      operatorId: actor.operatorId,
      platform,
      personaId,
      codeVerifier,
      expiresAt: new Date(now.getTime() + STATE_TTL_MS),
    });
    try {
      const url = await provider.authorizeUrl({
        state,
        redirectUri: this.redirectUri(platform),
        codeChallenge,
      });
      return ok({ url, state });
    } catch (e) {
      return err(this.providerError(platform, e));
    }
  }

  /**
   * Public callback: no session, the state is the only proof. Returns the channel id for the
   * browser redirect; every failure is a DomainError the web app renders from its messageId.
   */
  async completeOAuth(
    platform: OAuthPlatform,
    query: { code?: string; state?: string; error?: string },
  ): Promise<Result<ChannelRecord, DomainError>> {
    if (!query.state)
      return err(domainError('channel.oauth_state_invalid', 'errors.channel.oauthStateInvalid'));
    const pending = await this.states.consume(query.state, platform, this.clock.now());
    if (!pending)
      return err(domainError('channel.oauth_state_invalid', 'errors.channel.oauthStateInvalid'));
    if (query.error || !query.code) {
      return err(
        domainError('channel.oauth_denied', 'errors.channel.oauthDenied', {
          reason: query.error ?? 'no_code',
        }),
      );
    }
    const provider = this.providers.get(platform);
    if (!provider?.isConfigured()) return err(this.notConfigured(platform));

    let tokens: OAuthTokens;
    let account: ConnectedAccount;
    try {
      tokens = await provider.exchange({
        code: query.code,
        redirectUri: this.redirectUri(platform),
        codeVerifier: pending.codeVerifier,
      });
      account = await provider.whoAmI(tokens.accessToken);
    } catch (e) {
      return err(this.providerError(platform, e));
    }
    const secret: OAuthSecret = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    return this.attach({
      actor: { operatorId: pending.operatorId, workspaceId: pending.workspaceId },
      platform,
      personaId: pending.personaId,
      account,
      secret: JSON.stringify(secret),
      scopes: tokens.scopes,
      expiresAt: tokens.expiresAt,
      refreshable: tokens.refreshToken !== null,
    });
  }

  async connectTelegram(
    actor: Actor,
    botToken: string,
    personaId: string | null,
  ): Promise<Result<ChannelRecord, DomainError>> {
    const gate = await this.connectGate(actor, personaId);
    if (!gate.ok) return gate;
    let account: ConnectedAccount;
    try {
      // Quota is checked in attach(): a re-entered token for an existing bot is a reconnect.
      account = await this.telegram.validate(botToken);
    } catch (e) {
      return err(this.providerError('telegram', e));
    }
    return this.attach({
      actor,
      platform: 'telegram',
      personaId,
      account,
      secret: botToken,
      scopes: [],
      expiresAt: null,
      refreshable: false,
    });
  }

  async assignPersona(
    actor: Actor,
    id: string,
    personaId: string | null,
  ): Promise<Result<ChannelRecord, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'channel.connect',
    );
    if (!auth.ok) return auth;
    const existing = await this.load(actor.workspaceId, id);
    if (!existing.ok) return existing;
    const persona = await this.checkPersona(actor.workspaceId, personaId);
    if (!persona.ok) return persona;
    return ok(await this.repo.save(assignPersona(existing.value, personaId)));
  }

  /** A real read call with the stored credential; updates health either way. */
  async test(actor: Actor, id: string): Promise<Result<ChannelTestResult, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'channel.connect',
    );
    if (!auth.ok) return auth;
    const existing = await this.load(actor.workspaceId, id);
    if (!existing.ok) return existing;
    const channel = existing.value;
    const now = this.clock.now();
    try {
      const { account, refreshable } = await this.probe(channel);
      const saved = await this.repo.save({
        ...channel,
        handle: account.handle,
        displayName: account.displayName,
        health: healthFromExpiry({ ...channel, health: 'ok' }, now, { refreshable }),
        lastSyncAt: now,
        lastError: null,
      });
      return ok({ ok: true, handle: saved.handle, health: saved.health, detail: null });
    } catch (e) {
      const failure = this.providerError(channel.platform, e);
      const unauthorized = e instanceof ProviderHttpError && (e.status === 401 || e.status === 403);
      const saved = await this.repo.save(
        recordFailure(
          channel,
          {
            code: failure.code,
            message: String(failure.params?.['detail'] ?? failure.code),
            ...(unauthorized ? { health: 'token_expired' as const } : {}),
          },
          now,
        ),
      );
      return ok({
        ok: false,
        handle: null,
        health: saved.health,
        detail: saved.lastError?.message ?? null,
      });
    }
  }

  async disconnect(actor: Actor, id: string): Promise<Result<void, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'channel.disconnect',
    );
    if (!auth.ok) return auth;
    const existing = await this.load(actor.workspaceId, id);
    if (!existing.ok) return existing;
    await this.repo.remove(actor.workspaceId, id);
    await this.credentials.revoke(actor.workspaceId, existing.value.credentialId);
    return ok(undefined);
  }

  /** Refreshes an OAuth token (scheduler entry point, docs/08 §3: 24 h before expiry). */
  async refreshToken(workspaceId: string, id: string): Promise<Result<ChannelRecord, DomainError>> {
    const existing = await this.load(workspaceId, id);
    if (!existing.ok) return existing;
    const channel = existing.value;
    if (channel.platform === 'telegram') return ok(channel);
    const provider = this.providers.get(channel.platform);
    if (!provider?.refresh) return err(this.notConfigured(channel.platform));
    const raw = await this.credentials.reveal(workspaceId, channel.credentialId);
    if (!raw) return err(notFound(id));
    const secret = JSON.parse(raw) as OAuthSecret;
    const now = this.clock.now();
    try {
      // Meta refreshes with the long-lived token itself; the others with a refresh token.
      const tokens = await provider.refresh(secret.refreshToken ?? secret.accessToken);
      const next: OAuthSecret = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? secret.refreshToken,
      };
      await this.credentials.rotate(
        workspaceId,
        channel.credentialId,
        JSON.stringify(next),
        tokens.expiresAt,
      );
      return ok(
        await this.repo.save({
          ...channel,
          tokenExpiresAt: tokens.expiresAt,
          health: healthFromExpiry(
            { ...channel, tokenExpiresAt: tokens.expiresAt, health: 'ok' },
            now,
            {
              refreshable: next.refreshToken !== null,
            },
          ),
          lastError: null,
        }),
      );
    } catch (e) {
      const failure = this.providerError(channel.platform, e);
      return ok(
        await this.repo.save(
          recordFailure(
            channel,
            {
              code: failure.code,
              message: String(failure.params?.['detail'] ?? failure.code),
              health: 'token_expired',
            },
            now,
          ),
        ),
      );
    }
  }

  private async probe(
    channel: ChannelRecord,
  ): Promise<{ account: ConnectedAccount; refreshable: boolean }> {
    const raw = await this.credentials.reveal(channel.workspaceId, channel.credentialId);
    if (!raw) throw new ProviderHttpError(401, 'credential revoked', channel.platform);
    if (channel.platform === 'telegram') {
      return { account: await this.telegram.validate(raw), refreshable: false };
    }
    const provider = this.providers.get(channel.platform);
    if (!provider) throw new ProviderNotConfiguredError(channel.platform, []);
    const secret = JSON.parse(raw) as OAuthSecret;
    return {
      account: await provider.whoAmI(secret.accessToken),
      refreshable: secret.refreshToken !== null,
    };
  }

  private async connectGate(
    actor: Actor,
    personaId: string | null,
  ): Promise<Result<void, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'channel.connect',
    );
    if (!auth.ok) return auth;
    return this.checkPersona(actor.workspaceId, personaId);
  }

  private async assertQuota(workspaceId: string): Promise<Result<void, DomainError>> {
    const quota = await this.entitlements.assert(workspaceId, 'connected_accounts', {
      currentCount: await this.repo.countByWorkspace(workspaceId),
    });
    return quota.ok ? ok(undefined) : quota;
  }

  private async checkPersona(
    workspaceId: string,
    personaId: string | null,
  ): Promise<Result<void, DomainError>> {
    if (personaId === null) return ok(undefined);
    const persona = await this.personas.findById(workspaceId, personaId);
    return persona
      ? ok(undefined)
      : err(domainError('persona.not_found', 'errors.persona.notFound', { id: personaId }));
  }

  private async attach(input: {
    actor: Actor;
    platform: Platform;
    personaId: string | null;
    account: ConnectedAccount;
    secret: string;
    scopes: readonly string[];
    expiresAt: Date | null;
    refreshable: boolean;
  }): Promise<Result<ChannelRecord, DomainError>> {
    const { actor, platform, account } = input;
    const refreshable = { refreshable: input.refreshable };
    const now = this.clock.now();
    const existing = await this.repo.findByExternalAccount(platform, account.externalAccountId);
    if (existing && existing.workspaceId !== actor.workspaceId) {
      return err(
        domainError('channel.connected_elsewhere', 'errors.channel.connectedElsewhere', {
          handle: account.handle,
        }),
      );
    }
    if (existing) {
      // Reconnect: same account in the same workspace refreshes the credential in place.
      await this.credentials.rotate(
        actor.workspaceId,
        existing.credentialId,
        input.secret,
        input.expiresAt,
      );
      return ok(
        await this.repo.save({
          ...existing,
          personaId: input.personaId ?? existing.personaId,
          handle: account.handle,
          displayName: account.displayName,
          scopes: [...input.scopes],
          tokenExpiresAt: input.expiresAt,
          health: healthFromExpiry(
            { ...existing, tokenExpiresAt: input.expiresAt, health: 'ok' },
            now,
            refreshable,
          ),
          lastSyncAt: now,
          lastError: null,
        }),
      );
    }
    // New account: the quota decides (start() checked too, but two tabs could each pass it).
    const quota = await this.assertQuota(actor.workspaceId);
    if (!quota.ok) return quota;
    const capabilities = await this.config.get(
      'platform.capabilities',
      (raw) => CapabilitiesSchema.parse(raw),
      { platform },
    );
    const credentialId = await this.credentials.put({
      workspaceId: actor.workspaceId,
      kind: platform === 'telegram' ? 'bot_token:telegram' : `oauth:${platform}`,
      secret: input.secret,
      expiresAt: input.expiresAt,
    });
    const channel = connectChannel({
      id: ulid(),
      workspaceId: actor.workspaceId,
      personaId: input.personaId,
      platform,
      credentialId,
      scopes: input.scopes,
      capabilities,
      account,
      tokenExpiresAt: input.expiresAt,
      now,
    });
    if (!channel.ok) {
      await this.credentials.revoke(actor.workspaceId, credentialId);
      return channel;
    }
    return ok(await this.repo.save(channel.value));
  }

  private async load(workspaceId: string, id: string): Promise<Result<ChannelRecord, DomainError>> {
    const found = await this.repo.findById(workspaceId, id);
    return found ? ok(found) : err(notFound(id));
  }

  private notConfigured(platform: Platform): DomainError {
    return domainError('channel.provider_not_configured', 'errors.channel.providerNotConfigured', {
      platform,
    });
  }

  private providerError(platform: Platform, e: unknown): DomainError {
    if (e instanceof ProviderNotConfiguredError) return this.notConfigured(platform);
    const detail =
      e instanceof ProviderHttpError
        ? `${e.status}: ${e.bodyText.slice(0, 200)}`
        : e instanceof Error
          ? e.message
          : String(e);
    return domainError('channel.provider_rejected', 'errors.channel.providerRejected', {
      platform,
      detail,
    });
  }
}

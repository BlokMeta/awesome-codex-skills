import type { Channel, ConnectedAccount, Platform } from './channel.js';

export interface ChannelRecord extends Channel {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ChannelRepository {
  findById(workspaceId: string, id: string): Promise<ChannelRecord | null>;
  /** Cross-tenant by design: the same platform account may not be connected twice anywhere. */
  findByExternalAccount(
    platform: Platform,
    externalAccountId: string,
  ): Promise<ChannelRecord | null>;
  list(
    workspaceId: string,
    opts: { limit: number; after?: { createdAt: Date; id: string }; personaId?: string },
  ): Promise<{ items: ChannelRecord[]; hasMore: boolean }>;
  save(channel: Channel): Promise<ChannelRecord>;
  remove(workspaceId: string, id: string): Promise<void>;
  countByWorkspace(workspaceId: string): Promise<number>;
}

/** Secret material never crosses this boundary in plain text except through `reveal`. */
export interface CredentialStore {
  put(input: {
    workspaceId: string;
    kind: string;
    secret: string;
    expiresAt: Date | null;
  }): Promise<string>;
  reveal(workspaceId: string, credentialId: string): Promise<string | null>;
  rotate(
    workspaceId: string,
    credentialId: string,
    secret: string,
    expiresAt: Date | null,
  ): Promise<void>;
  revoke(workspaceId: string, credentialId: string): Promise<void>;
}

export interface OAuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly expiresAt: Date | null;
  readonly scopes: readonly string[];
}

export interface OAuthStartInput {
  readonly state: string;
  readonly redirectUri: string;
  readonly codeChallenge: string | null;
}

export interface OAuthExchangeInput {
  readonly code: string;
  readonly redirectUri: string;
  readonly codeVerifier: string | null;
}

/**
 * One per OAuth platform. Endpoints and scopes come from dynamic config (`platform.oauth`,
 * ADR-0011); the adapter only knows the request shapes of the official API.
 */
export interface OAuthProvider {
  readonly platform: Platform;
  readonly usesPkce: boolean;
  authorizeUrl(input: OAuthStartInput): Promise<string>;
  exchange(input: OAuthExchangeInput): Promise<OAuthTokens>;
  /** The account the token belongs to; also the "try the connection" probe. */
  whoAmI(accessToken: string): Promise<ConnectedAccount>;
  refresh?(refreshToken: string): Promise<OAuthTokens>;
}

/** Telegram has no OAuth: a bot token is validated with getMe and stored as the credential. */
export interface BotTokenProvider {
  readonly platform: 'telegram';
  validate(botToken: string): Promise<ConnectedAccount>;
}

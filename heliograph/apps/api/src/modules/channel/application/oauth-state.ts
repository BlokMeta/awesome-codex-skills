import type { Platform } from '@heliograph/domain';

/** A pending OAuth handshake between `start` and the provider's callback (10 minutes). */
export interface OAuthState {
  readonly state: string;
  readonly workspaceId: string;
  readonly operatorId: string;
  readonly platform: Platform;
  readonly personaId: string | null;
  readonly codeVerifier: string | null;
  readonly expiresAt: Date;
}

export interface OAuthStateRepository {
  create(state: OAuthState): Promise<void>;
  /** Returns and deletes the state in one step; null when unknown, expired or already used. */
  consume(state: string, platform: Platform, now: Date): Promise<OAuthState | null>;
  purgeExpired(now: Date): Promise<number>;
}

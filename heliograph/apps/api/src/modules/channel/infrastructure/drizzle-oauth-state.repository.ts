import type { Platform } from '@heliograph/domain';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import { withoutTenant, withWorkspace } from '../../../db/tenant.js';
import type { OAuthState, OAuthStateRepository } from '../application/oauth-state.js';
import { oauthStates } from './schema.js';

export class DrizzleOAuthStateRepository implements OAuthStateRepository {
  constructor(private readonly db: Database) {}

  async create(state: OAuthState): Promise<void> {
    await withWorkspace(this.db, state.workspaceId, async (tx) => {
      await tx.insert(oauthStates).values({
        state: state.state,
        workspaceId: state.workspaceId,
        operatorId: state.operatorId,
        platform: state.platform,
        personaId: state.personaId,
        codeVerifier: state.codeVerifier,
        expiresAt: state.expiresAt,
      });
    });
  }

  /**
   * The provider's browser redirect carries no session, so the handshake is resolved by its
   * random state alone (cross-tenant by necessity) and consumed atomically: replays get null.
   */
  consume(state: string, platform: Platform, now: Date): Promise<OAuthState | null> {
    return withoutTenant(this.db, 'channel.oauth_callback', async (tx) => {
      const [row] = await tx
        .delete(oauthStates)
        .where(
          and(
            eq(oauthStates.state, state),
            eq(oauthStates.platform, platform),
            gt(oauthStates.expiresAt, now),
          ),
        )
        .returning();
      return row
        ? {
            state: row.state,
            workspaceId: row.workspaceId,
            operatorId: row.operatorId,
            platform: row.platform,
            personaId: row.personaId,
            codeVerifier: row.codeVerifier,
            expiresAt: row.expiresAt,
          }
        : null;
    });
  }

  async purgeExpired(now: Date): Promise<number> {
    return withoutTenant(this.db, 'channel.oauth_state_purge', async (tx) => {
      const rows = await tx.delete(oauthStates).where(lt(oauthStates.expiresAt, now)).returning();
      return rows.length;
    });
  }
}

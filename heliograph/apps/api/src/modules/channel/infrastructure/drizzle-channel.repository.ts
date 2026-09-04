import {
  type Channel,
  type ChannelRecord,
  type ChannelRepository,
  ChannelSchema,
  type Platform,
} from '@heliograph/domain';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import { withoutTenant, withWorkspace } from '../../../db/tenant.js';
import { channels } from './schema.js';

type Row = typeof channels.$inferSelect;

const toRecord = (r: Row): ChannelRecord => {
  const lastError = r.lastError as { code: string; message: string; at: string } | null;
  return {
    ...ChannelSchema.parse({
      id: r.id,
      workspaceId: r.workspaceId,
      personaId: r.personaId,
      platform: r.platform,
      externalAccountId: r.externalAccountId,
      handle: r.handle,
      displayName: r.displayName,
      credentialId: r.credentialId,
      scopes: r.scopes,
      capabilities: r.capabilities,
      health: r.health,
      tokenExpiresAt: r.tokenExpiresAt,
      lastSyncAt: r.lastSyncAt,
      lastError: lastError ? { ...lastError, at: new Date(lastError.at) } : null,
    }),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

const toRow = (c: Channel) => ({
  id: c.id,
  workspaceId: c.workspaceId,
  personaId: c.personaId,
  platform: c.platform,
  externalAccountId: c.externalAccountId,
  handle: c.handle,
  displayName: c.displayName,
  credentialId: c.credentialId,
  scopes: [...c.scopes],
  capabilities: c.capabilities,
  health: c.health,
  tokenExpiresAt: c.tokenExpiresAt,
  lastSyncAt: c.lastSyncAt,
  lastError: c.lastError ? { ...c.lastError, at: c.lastError.at.toISOString() } : null,
});

/** Tenant-scoped except `findByExternalAccount`, which enforces the global uniqueness rule. */
export class DrizzleChannelRepository implements ChannelRepository {
  constructor(private readonly db: Database) {}

  findById(workspaceId: string, id: string): Promise<ChannelRecord | null> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select()
        .from(channels)
        .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)))
        .limit(1);
      return row ? toRecord(row) : null;
    });
  }

  findByExternalAccount(
    platform: Platform,
    externalAccountId: string,
  ): Promise<ChannelRecord | null> {
    return withoutTenant(this.db, 'channel.duplicate_account_guard', async (tx) => {
      const [row] = await tx
        .select()
        .from(channels)
        .where(
          and(eq(channels.platform, platform), eq(channels.externalAccountId, externalAccountId)),
        )
        .limit(1);
      return row ? toRecord(row) : null;
    });
  }

  list(
    workspaceId: string,
    opts: { limit: number; after?: { createdAt: Date; id: string }; personaId?: string },
  ): Promise<{ items: ChannelRecord[]; hasMore: boolean }> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const conditions = [eq(channels.workspaceId, workspaceId)];
      if (opts.personaId) conditions.push(eq(channels.personaId, opts.personaId));
      if (opts.after) {
        const a = opts.after;
        conditions.push(
          or(
            lt(channels.createdAt, a.createdAt),
            and(eq(channels.createdAt, a.createdAt), lt(channels.id, a.id)),
          ) as ReturnType<typeof eq>,
        );
      }
      const rows = await tx
        .select()
        .from(channels)
        .where(and(...conditions))
        .orderBy(desc(channels.createdAt), desc(channels.id))
        .limit(opts.limit + 1);
      return { items: rows.slice(0, opts.limit).map(toRecord), hasMore: rows.length > opts.limit };
    });
  }

  save(channel: Channel): Promise<ChannelRecord> {
    return withWorkspace(this.db, channel.workspaceId, async (tx) => {
      const values = toRow(channel);
      const [saved] = await tx
        .insert(channels)
        .values(values)
        .onConflictDoUpdate({ target: channels.id, set: { ...values, updatedAt: sql`now()` } })
        .returning();
      if (!saved) throw new Error('channel upsert returned no row');
      return toRecord(saved);
    });
  }

  remove(workspaceId: string, id: string): Promise<void> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      await tx
        .delete(channels)
        .where(and(eq(channels.workspaceId, workspaceId), eq(channels.id, id)));
    });
  }

  countByWorkspace(workspaceId: string): Promise<number> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select({ n: sql<string>`count(*)` })
        .from(channels)
        .where(eq(channels.workspaceId, workspaceId));
      return Number(row?.n ?? 0);
    });
  }
}

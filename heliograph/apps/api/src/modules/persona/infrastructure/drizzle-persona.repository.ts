import {
  type Persona,
  type PersonaListAfter,
  type PersonaPage,
  type PersonaRecord,
  type PersonaRepository,
  PersonaSchema,
  type PersonaStatus,
} from '@heliograph/domain';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../../../db/client.js';
import { withWorkspace } from '../../../db/tenant.js';
import { personas, personaVersions } from './schema.js';

type Row = typeof personas.$inferSelect;

const toRecord = (r: Row): PersonaRecord => ({
  ...PersonaSchema.parse({
    id: r.id,
    workspaceId: r.workspaceId,
    slug: r.slug,
    name: r.name,
    niche: r.niche,
    language: r.language,
    timezone: r.timezone,
    postingPolicy: r.postingPolicy,
    voiceBible: r.voiceBible,
    visualKit: r.visualKit,
    topicProfile: r.topicProfile,
    engagementPolicy: r.engagementPolicy,
    qualityPolicy: r.qualityPolicy,
    status: r.status,
    warmupStartedAt: r.warmupStartedAt,
  }),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const toRow = (p: Persona) => ({
  id: p.id,
  workspaceId: p.workspaceId,
  slug: p.slug,
  name: p.name,
  niche: p.niche,
  language: p.language,
  timezone: p.timezone,
  postingPolicy: p.postingPolicy,
  voiceBible: p.voiceBible,
  visualKit: p.visualKit,
  topicProfile: p.topicProfile,
  engagementPolicy: p.engagementPolicy,
  qualityPolicy: p.qualityPolicy,
  status: p.status,
  warmupStartedAt: p.warmupStartedAt,
});

/** Every call runs inside the workspace's RLS transaction (docs/03 §6). */
export class DrizzlePersonaRepository implements PersonaRepository {
  constructor(private readonly db: Database) {}

  findById(workspaceId: string, id: string): Promise<PersonaRecord | null> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select()
        .from(personas)
        .where(and(eq(personas.workspaceId, workspaceId), eq(personas.id, id)))
        .limit(1);
      return row ? toRecord(row) : null;
    });
  }

  findBySlug(workspaceId: string, slug: string): Promise<PersonaRecord | null> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select()
        .from(personas)
        .where(and(eq(personas.workspaceId, workspaceId), eq(personas.slug, slug)))
        .limit(1);
      return row ? toRecord(row) : null;
    });
  }

  list(
    workspaceId: string,
    opts: { limit: number; after?: PersonaListAfter; status?: PersonaStatus },
  ): Promise<PersonaPage> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const conditions = [eq(personas.workspaceId, workspaceId)];
      if (opts.status) conditions.push(eq(personas.status, opts.status));
      if (opts.after) {
        const a = opts.after;
        conditions.push(
          or(
            lt(personas.createdAt, a.createdAt),
            and(eq(personas.createdAt, a.createdAt), lt(personas.id, a.id)),
          ) as ReturnType<typeof eq>,
        );
      }
      const rows = await tx
        .select()
        .from(personas)
        .where(and(...conditions))
        .orderBy(desc(personas.createdAt), desc(personas.id))
        .limit(opts.limit + 1);
      return { items: rows.slice(0, opts.limit).map(toRecord), hasMore: rows.length > opts.limit };
    });
  }

  save(
    persona: Persona,
    audit: { changedBy: string; reason: string | null },
  ): Promise<PersonaRecord> {
    return withWorkspace(this.db, persona.workspaceId, async (tx) => {
      const [previous] = await tx
        .select()
        .from(personas)
        .where(eq(personas.id, persona.id))
        .limit(1);
      if (previous) {
        await tx.insert(personaVersions).values({
          id: ulid(),
          workspaceId: persona.workspaceId,
          personaId: persona.id,
          snapshot: toRow(toRecord(previous)),
          changedBy: audit.changedBy,
          reason: audit.reason,
        });
      }
      const values = toRow(persona);
      const [saved] = await tx
        .insert(personas)
        .values(values)
        .onConflictDoUpdate({ target: personas.id, set: { ...values, updatedAt: sql`now()` } })
        .returning();
      if (!saved) throw new Error('persona upsert returned no row');
      return toRecord(saved);
    });
  }

  countActive(workspaceId: string): Promise<number> {
    return withWorkspace(this.db, workspaceId, async (tx) => {
      const [row] = await tx
        .select({ n: sql<string>`count(*)` })
        .from(personas)
        .where(
          and(
            eq(personas.workspaceId, workspaceId),
            inArray(personas.status, ['draft', 'warming', 'active', 'paused']),
          ),
        );
      return Number(row?.n ?? 0);
    });
  }
}

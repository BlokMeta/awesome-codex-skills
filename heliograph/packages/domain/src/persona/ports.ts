import type { Persona, PersonaStatus } from './persona.js';

export interface PersonaRecord extends Persona {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PersonaPage {
  readonly items: PersonaRecord[];
  readonly hasMore: boolean;
}

/** Keyset cursor for persona lists: newest first, tie-broken by id (docs/11 §13). */
export interface PersonaListAfter {
  readonly createdAt: Date;
  readonly id: string;
}

export interface PersonaRepository {
  findById(workspaceId: string, id: string): Promise<PersonaRecord | null>;
  findBySlug(workspaceId: string, slug: string): Promise<PersonaRecord | null>;
  list(
    workspaceId: string,
    opts: { limit: number; after?: PersonaListAfter; status?: PersonaStatus },
  ): Promise<PersonaPage>;
  /** Insert or update; `snapshotReason` set → previous state is written to persona_versions. */
  save(
    persona: Persona,
    audit: { changedBy: string; reason: string | null },
  ): Promise<PersonaRecord>;
  countActive(workspaceId: string): Promise<number>;
}

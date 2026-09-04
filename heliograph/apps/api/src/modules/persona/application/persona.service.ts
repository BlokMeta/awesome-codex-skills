import {
  activate,
  archive,
  type Clock,
  createDraft,
  type DomainError,
  domainError,
  err,
  ok,
  type Persona,
  type PersonaListAfter,
  type PersonaPage,
  type PersonaRecord,
  type PersonaRepository,
  PersonaSchema,
  type PersonaStatus,
  pause,
  type Result,
  readyToStart,
} from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { CLOCK, PERSONA_REPOSITORY } from '../../../shared/tokens.js';
import { EntitlementService } from '../../billing/application/entitlement.service.js';
import { Authorizer } from '../../identity/application/authorizer.js';

export interface Actor {
  readonly operatorId: string;
  readonly workspaceId: string;
}

type PatchableKey =
  | 'name'
  | 'niche'
  | 'language'
  | 'timezone'
  | 'postingPolicy'
  | 'voiceBible'
  | 'visualKit'
  | 'topicProfile'
  | 'engagementPolicy'
  | 'qualityPolicy';

/** Wizard steps send only the fields they own; `undefined` means "leave as is". */
type PersonaPatch = { [K in PatchableKey]?: Persona[K] | undefined };

const definedEntries = (patch: PersonaPatch): Partial<Pick<Persona, PatchableKey>> =>
  Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<
    Pick<Persona, PatchableKey>
  >;

export const slugify = (name: string): string =>
  name
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

/**
 * Persona use-cases. Order inside every mutation (rules 14, 8 §2): authorize → entitlement →
 * domain rule → persist. Reads only authorize.
 */
@Injectable()
export class PersonaService {
  constructor(
    @Inject(PERSONA_REPOSITORY) private readonly repo: PersonaRepository,
    @Inject(Authorizer) private readonly authorizer: Authorizer,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(
    actor: Actor,
    opts: { limit: number; after?: PersonaListAfter; status?: PersonaStatus },
  ): Promise<Result<PersonaPage, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'workspace.read',
    );
    if (!auth.ok) return auth;
    return ok(await this.repo.list(actor.workspaceId, opts));
  }

  async get(actor: Actor, id: string): Promise<Result<PersonaRecord, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'workspace.read',
    );
    if (!auth.ok) return auth;
    return this.load(actor.workspaceId, id);
  }

  async create(
    actor: Actor,
    input: {
      name: string;
      slug?: string | undefined;
      niche: Persona['niche'];
      language: string;
      timezone: string;
    },
  ): Promise<Result<PersonaRecord, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'persona.manage',
    );
    if (!auth.ok) return auth;
    const current = await this.repo.countActive(actor.workspaceId);
    const quota = await this.entitlements.assert(actor.workspaceId, 'personas', {
      currentCount: current,
    });
    if (!quota.ok) return quota;
    const slug = input.slug ?? slugify(input.name);
    if (await this.repo.findBySlug(actor.workspaceId, slug)) {
      return err(domainError('persona.slug_taken', 'errors.persona.slugTaken', { slug }));
    }
    const draft = createDraft({ id: ulid(), workspaceId: actor.workspaceId, ...input, slug });
    if (!draft.ok) return draft;
    return ok(await this.repo.save(draft.value, { changedBy: actor.operatorId, reason: 'create' }));
  }

  async update(
    actor: Actor,
    id: string,
    patch: PersonaPatch,
    reason: string | null,
  ): Promise<Result<PersonaRecord, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'persona.manage',
    );
    if (!auth.ok) return auth;
    const existing = await this.load(actor.workspaceId, id);
    if (!existing.ok) return existing;
    if (existing.value.status === 'archived') {
      return err(domainError('persona.archived', 'errors.persona.archived'));
    }
    const merged = PersonaSchema.safeParse({ ...existing.value, ...definedEntries(patch) });
    if (!merged.success) {
      return err(
        domainError('persona.invalid', 'errors.persona.invalid', {
          issue: merged.error.issues[0]?.path.join('.') ?? 'unknown',
        }),
      );
    }
    return ok(await this.repo.save(merged.data, { changedBy: actor.operatorId, reason }));
  }

  async activate(actor: Actor, id: string): Promise<Result<PersonaRecord, DomainError>> {
    return this.transition(actor, id, (p) => {
      const missing = readyToStart(p);
      return missing ? err(missing) : activate(p, this.clock);
    });
  }

  async pause(actor: Actor, id: string): Promise<Result<PersonaRecord, DomainError>> {
    return this.transition(actor, id, pause);
  }

  async archive(actor: Actor, id: string): Promise<Result<PersonaRecord, DomainError>> {
    return this.transition(actor, id, archive);
  }

  private async transition(
    actor: Actor,
    id: string,
    apply: (p: Persona) => Result<Persona, DomainError>,
  ): Promise<Result<PersonaRecord, DomainError>> {
    const auth = await this.authorizer.assert(
      actor.operatorId,
      actor.workspaceId,
      'persona.manage',
    );
    if (!auth.ok) return auth;
    const existing = await this.load(actor.workspaceId, id);
    if (!existing.ok) return existing;
    const next = apply(existing.value);
    if (!next.ok) return next;
    return ok(
      await this.repo.save(next.value, {
        changedBy: actor.operatorId,
        reason: `status:${next.value.status}`,
      }),
    );
  }

  private async load(workspaceId: string, id: string): Promise<Result<PersonaRecord, DomainError>> {
    const found = await this.repo.findById(workspaceId, id);
    return found
      ? ok(found)
      : err(domainError('persona.not_found', 'errors.persona.notFound', { id }));
  }
}

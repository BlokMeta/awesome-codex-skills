import { contract, decodeCursor, encodeCursor, type PersonaDto } from '@heliograph/contracts';
import { type PersonaRecord, readyToStart } from '@heliograph/domain';
import { Controller, Inject, Req } from '@nestjs/common';
import { Implement, implement, ORPCError } from '@orpc/nest';
import type { FastifyRequest } from 'fastify';
import { unwrapOrThrow } from '../../../shared/http/domain-error.js';
import type { Principal } from '../../identity/application/principal.js';
import { CurrentSession, CurrentWorkspace } from '../../identity/interface/auth.decorators.js';
import { type Actor, PersonaService } from '../application/persona.service.js';

const toDto = (p: PersonaRecord): PersonaDto => ({
  id: p.id,
  workspaceId: p.workspaceId,
  slug: p.slug,
  name: p.name,
  niche: p.niche,
  language: p.language,
  timezone: p.timezone,
  status: p.status,
  warmupStartedAt: p.warmupStartedAt?.toISOString() ?? null,
  postingPolicy: p.postingPolicy,
  voiceBible: p.voiceBible,
  visualKit: p.visualKit,
  topicProfile: p.topicProfile,
  engagementPolicy: p.engagementPolicy,
  qualityPolicy: p.qualityPolicy,
  missingForStart: String(readyToStart(p)?.params?.['fields'] ?? '')
    .split(', ')
    .filter(Boolean),
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

@Controller()
export class PersonaController {
  constructor(@Inject(PersonaService) private readonly personas: PersonaService) {}

  private actor(session: Principal, workspaceId: string): Actor {
    return { operatorId: session.user.id, workspaceId };
  }

  @Implement(contract.persona.list)
  list(
    @CurrentSession() session: Principal,
    @CurrentWorkspace() workspaceId: string,
    @Req() req: FastifyRequest,
  ) {
    return implement(contract.persona.list).handler(async ({ input }) => {
      const after = input.cursor ? decodeCursor(input.cursor) : null;
      if (input.cursor && !after) {
        throw new ORPCError('BAD_REQUEST', {
          status: 400,
          message: 'invalid_cursor',
          data: {
            problem: {
              code: 'pagination.invalid_cursor',
              messageId: 'errors.pagination.invalidCursor',
            },
          },
        });
      }
      const page = unwrapOrThrow(
        await this.personas.list(this.actor(session, workspaceId), {
          limit: input.limit,
          ...(after ? { after: { createdAt: new Date(String(after.k)), id: after.id } } : {}),
          ...(input.status ? { status: input.status } : {}),
        }),
      );
      const last = page.items.at(-1);
      return {
        data: page.items.map(toDto),
        page: {
          nextCursor:
            page.hasMore && last
              ? encodeCursor({ k: last.createdAt.toISOString(), id: last.id })
              : null,
          prevCursor: null,
          limit: input.limit,
          hasMore: page.hasMore,
        },
        meta: { requestId: String(req.id) },
      };
    });
  }

  @Implement(contract.persona.create)
  create(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.persona.create).handler(async ({ input }) =>
      toDto(unwrapOrThrow(await this.personas.create(this.actor(session, workspaceId), input))),
    );
  }

  @Implement(contract.persona.get)
  get(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.persona.get).handler(async ({ input }) =>
      toDto(unwrapOrThrow(await this.personas.get(this.actor(session, workspaceId), input.id))),
    );
  }

  @Implement(contract.persona.update)
  update(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.persona.update).handler(async ({ input }) => {
      const { id, reason, ...patch } = input;
      return toDto(
        unwrapOrThrow(
          await this.personas.update(this.actor(session, workspaceId), id, patch, reason ?? null),
        ),
      );
    });
  }

  @Implement(contract.persona.activate)
  activate(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.persona.activate).handler(async ({ input }) =>
      toDto(
        unwrapOrThrow(await this.personas.activate(this.actor(session, workspaceId), input.id)),
      ),
    );
  }

  @Implement(contract.persona.pause)
  pause(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.persona.pause).handler(async ({ input }) =>
      toDto(unwrapOrThrow(await this.personas.pause(this.actor(session, workspaceId), input.id))),
    );
  }

  @Implement(contract.persona.archive)
  archive(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.persona.archive).handler(async ({ input }) =>
      toDto(unwrapOrThrow(await this.personas.archive(this.actor(session, workspaceId), input.id))),
    );
  }
}

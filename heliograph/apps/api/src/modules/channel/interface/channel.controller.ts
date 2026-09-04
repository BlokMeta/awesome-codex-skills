import { type ChannelDto, contract, decodeCursor, encodeCursor } from '@heliograph/contracts';
import { type ChannelRecord, PlatformSchema } from '@heliograph/domain';
import { Controller, Get, Inject, Param, Query, Req, Res } from '@nestjs/common';
import { Implement, implement, ORPCError } from '@orpc/nest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { unwrapOrThrow } from '../../../shared/http/domain-error.js';
import type { Principal } from '../../identity/application/principal.js';
import {
  CurrentSession,
  CurrentWorkspace,
  Public,
} from '../../identity/interface/auth.decorators.js';
import { type Actor, ChannelService, type OAuthPlatform } from '../application/channel.service.js';

export const WEB_URL = Symbol('WebUrl');

const toDto = (c: ChannelRecord): ChannelDto => ({
  id: c.id,
  workspaceId: c.workspaceId,
  personaId: c.personaId,
  platform: c.platform,
  externalAccountId: c.externalAccountId,
  handle: c.handle,
  displayName: c.displayName,
  scopes: c.scopes,
  capabilities: c.capabilities,
  health: c.health,
  tokenExpiresAt: c.tokenExpiresAt?.toISOString() ?? null,
  lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
  lastError: c.lastError ? { ...c.lastError, at: c.lastError.at.toISOString() } : null,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

const OAuthPlatformSchema = PlatformSchema.exclude(['telegram']);

@Controller()
export class ChannelController {
  constructor(
    @Inject(ChannelService) private readonly channels: ChannelService,
    @Inject(WEB_URL) private readonly webUrl: string,
  ) {}

  private actor(session: Principal, workspaceId: string): Actor {
    return { operatorId: session.user.id, workspaceId };
  }

  @Implement(contract.channel.list)
  list(
    @CurrentSession() session: Principal,
    @CurrentWorkspace() workspaceId: string,
    @Req() req: FastifyRequest,
  ) {
    return implement(contract.channel.list).handler(async ({ input }) => {
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
        await this.channels.list(this.actor(session, workspaceId), {
          limit: input.limit,
          ...(after ? { after: { createdAt: new Date(String(after.k)), id: after.id } } : {}),
          ...(input.personaId ? { personaId: input.personaId } : {}),
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

  @Implement(contract.channel.platforms)
  platforms() {
    return implement(contract.channel.platforms).handler(async () => ({
      available: this.channels.availablePlatforms(),
    }));
  }

  @Implement(contract.channel.get)
  get(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.channel.get).handler(async ({ input }) =>
      toDto(unwrapOrThrow(await this.channels.get(this.actor(session, workspaceId), input.id))),
    );
  }

  @Implement(contract.channel.startOAuth)
  startOAuth(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.channel.startOAuth).handler(async ({ input }) =>
      unwrapOrThrow(
        await this.channels.startOAuth(
          this.actor(session, workspaceId),
          input.platform,
          input.personaId ?? null,
        ),
      ),
    );
  }

  /**
   * Where the platform sends the browser back. Public by nature (docs/05 §5); the outcome is
   * carried to the web app as a query string, never as a JSON body the user would see.
   */
  @Public()
  @Get('v1/channels/oauth/:platform/callback')
  async callback(
    @Param('platform') platform: string,
    @Query() query: Record<string, string | undefined>,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const target = new URL('/channels', this.webUrl);
    const parsed = OAuthPlatformSchema.safeParse(platform);
    if (!parsed.success) {
      target.searchParams.set('error', 'channel.unknown_platform');
      await reply.redirect(target.toString(), 302);
      return;
    }
    const result = await this.channels.completeOAuth(parsed.data as OAuthPlatform, {
      ...(query['code'] ? { code: query['code'] } : {}),
      ...(query['state'] ? { state: query['state'] } : {}),
      ...(query['error'] ? { error: query['error'] } : {}),
    });
    if (result.ok) target.searchParams.set('connected', result.value.id);
    else {
      target.searchParams.set('error', result.error.code);
      target.searchParams.set('platform', parsed.data);
    }
    await reply.redirect(target.toString(), 302);
  }

  @Implement(contract.channel.connectTelegram)
  connectTelegram(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.channel.connectTelegram).handler(async ({ input }) =>
      toDto(
        unwrapOrThrow(
          await this.channels.connectTelegram(
            this.actor(session, workspaceId),
            input.botToken,
            input.personaId ?? null,
          ),
        ),
      ),
    );
  }

  @Implement(contract.channel.update)
  update(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.channel.update).handler(async ({ input }) =>
      toDto(
        unwrapOrThrow(
          await this.channels.assignPersona(
            this.actor(session, workspaceId),
            input.id,
            input.personaId,
          ),
        ),
      ),
    );
  }

  @Implement(contract.channel.test)
  test(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.channel.test).handler(async ({ input }) =>
      unwrapOrThrow(await this.channels.test(this.actor(session, workspaceId), input.id)),
    );
  }

  @Implement(contract.channel.disconnect)
  disconnect(@CurrentSession() session: Principal, @CurrentWorkspace() workspaceId: string) {
    return implement(contract.channel.disconnect).handler(async ({ input }) => {
      unwrapOrThrow(await this.channels.disconnect(this.actor(session, workspaceId), input.id));
    });
  }
}

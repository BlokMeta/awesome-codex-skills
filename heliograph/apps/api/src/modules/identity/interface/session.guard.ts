import type { IncomingHttpHeaders } from 'node:http';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { AUTH } from '../../../shared/tokens.js';
import type { Auth } from '../infrastructure/auth.js';
import { IS_PUBLIC, type RequestWithSession } from './auth.decorators.js';

/**
 * Global guard: every route needs a valid better-auth session unless marked @Public().
 * Cookie (web) and `Authorization: Bearer` (mobile) are both accepted by better-auth itself.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    const req = ctx
      .switchToHttp()
      .getRequest<RequestWithSession & { headers: IncomingHttpHeaders }>();
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException({ code: 'auth.unauthenticated' });
    req.session = session;
    return true;
  }
}

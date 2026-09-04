import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { SessionContext } from '../infrastructure/auth.js';

export const IS_PUBLIC = 'hg:public';

/** Marks a route as reachable without a session (health, webhooks, legal pages). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface RequestWithSession {
  session?: SessionContext;
}

/** The verified session attached by SessionGuard. Never undefined on non-public routes. */
export const CurrentSession = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<RequestWithSession>();
  if (!req.session) throw new Error('CurrentSession used on a route without SessionGuard');
  return req.session;
});

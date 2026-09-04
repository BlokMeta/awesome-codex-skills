import {
  ConflictException,
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
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

/**
 * The workspace the session is scoped to (better-auth active organization). Tenant endpoints
 * require it; without one the client must call organization/set-active first (409).
 */
export const CurrentWorkspace = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<RequestWithSession>();
  const workspaceId = req.session?.session.activeOrganizationId;
  if (!workspaceId) throw new ConflictException({ code: 'workspace.none_active' });
  return workspaceId;
});

/** Client address + agent for consent and audit records (behind the trusted proxy). */
export const ClientMeta = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ ip?: string; headers: Record<string, unknown> }>();
  const ua = req.headers['user-agent'];
  return { ip: req.ip ?? null, userAgent: typeof ua === 'string' ? ua : null };
});

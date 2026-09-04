import type { DomainError, Result } from '@heliograph/domain';
import { ORPCError } from '@orpc/nest';

/** Domain codes that map to something other than 422 (docs/05 §3). */
const STATUS_BY_CODE: Record<string, number> = {
  'billing.entitlement_exceeded': 429,
  'billing.insufficient_credits': 429,
  'identity.not_a_member': 403,
  'identity.forbidden': 403,
};

const ORPC_CODE: Record<number, string> = {
  403: 'FORBIDDEN',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_CONTENT',
  429: 'TOO_MANY_REQUESTS',
};

const problemOf = (e: DomainError) => ({
  code: e.code,
  messageId: e.messageId,
  ...(e.params ? { params: e.params } : {}),
});

/**
 * For oRPC handlers: converts a failed Result into an ORPCError whose `data.problem` the
 * response interceptor (orpc-problem.ts) turns into RFC 9457 Problem Details.
 */
export function unwrapOrThrow<T>(r: Result<T, DomainError>): T {
  if (r.ok) return r.value;
  const status = STATUS_BY_CODE[r.error.code] ?? 422;
  throw new ORPCError(ORPC_CODE[status] ?? 'UNPROCESSABLE_CONTENT', {
    status,
    message: r.error.code,
    data: { problem: problemOf(r.error) },
  });
}

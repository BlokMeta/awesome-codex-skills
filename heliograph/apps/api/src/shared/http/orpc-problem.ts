import { type Problem, problemType } from '@heliograph/contracts';
import type { ORPCModuleConfig } from '@orpc/nest';
import type { FastifyReply } from 'fastify';

type SendInterceptor = NonNullable<ORPCModuleConfig['sendResponseInterceptors']>[number];

const SLUGS: Record<number, string> = {
  400: 'bad-request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  422: 'validation',
  429: 'rate-limited',
};

interface OrpcErrorBody {
  code: string;
  status: number;
  message?: string;
  data?: unknown;
}

const isOrpcErrorBody = (b: unknown): b is OrpcErrorBody =>
  typeof b === 'object' && b !== null && 'code' in b && 'status' in b && 'defined' in b;

interface ZodIssueLike {
  path?: (string | number)[];
  code?: string;
  message?: string;
}

function fieldErrors(data: unknown): Problem['errors'] {
  const issues = (data as { issues?: ZodIssueLike[] } | undefined)?.issues;
  if (!Array.isArray(issues)) return undefined;
  return issues.map((i) => {
    const code = `validation.${i.code ?? 'invalid'}`;
    return { path: (i.path ?? []).join('.'), code, messageId: `errors.${code}` };
  });
}

/**
 * oRPC renders errors thrown inside `implement().handler()` itself (Nest filters never see
 * them). This interceptor rewrites that body into RFC 9457 Problem Details (docs/05 §3):
 * domain errors carry `data.problem` (see unwrapOrThrow), validation errors carry zod issues.
 */
export const orpcProblemInterceptor: SendInterceptor = async (options) => {
  const { standardResponse, request } = options;
  if (standardResponse.status < 400 || !isOrpcErrorBody(standardResponse.body)) {
    return options.next();
  }
  const body = standardResponse.body;
  const status = standardResponse.status;
  const slug = SLUGS[status] ?? 'error';
  const domain = (body.data as { problem?: Partial<Problem> } | undefined)?.problem;
  const code = domain?.code ?? (status === 400 ? 'validation.failed' : `http.${slug}`);
  const errors = fieldErrors(body.data);
  const problem: Problem = {
    type: problemType(domain ? code.replace(/[._]/g, '-') : slug),
    title: body.message ?? slug,
    status,
    instance: (request as { url?: string }).url ?? '',
    code,
    messageId: domain?.messageId ?? `errors.${code}`,
    ...(domain?.params ? { params: domain.params } : {}),
    requestId: String((request as { id?: string }).id ?? ''),
    ...(errors ? { errors } : {}),
  };
  // oRPC's sender forces application/json for object bodies, so the problem is sent directly.
  const reply = options.response as FastifyReply;
  await reply
    .status(status)
    .header('content-type', 'application/problem+json; charset=utf-8')
    .send(JSON.stringify(problem));
};

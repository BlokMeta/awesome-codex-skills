import { type Problem, problemType } from '@heliograph/contracts';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

const SLUGS: Record<number, string> = {
  400: 'bad-request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  422: 'validation',
  429: 'rate-limited',
};

/** Renders Nest HttpExceptions as RFC 9457 Problem Details (docs/05 §3). */
@Catch(HttpException)
export class ProblemFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const req = http.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const res = exception.getResponse();
    const extra = typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : {};
    const slug = SLUGS[status] ?? 'error';
    const code = typeof extra['code'] === 'string' ? extra['code'] : `http.${slug}`;
    const messageId =
      typeof extra['messageId'] === 'string' ? extra['messageId'] : `errors.${code}`;
    const params = extra['params'];
    const problem: Problem = {
      type: problemType(code.includes('.') ? code.replace(/[._]/g, '-') : slug),
      title: exception.message,
      status,
      instance: req.url,
      code,
      messageId,
      ...(params && typeof params === 'object'
        ? { params: params as Record<string, string | number> }
        : {}),
      requestId: String(req.id),
    };
    void reply.status(status).header('content-type', 'application/problem+json').send(problem);
  }
}

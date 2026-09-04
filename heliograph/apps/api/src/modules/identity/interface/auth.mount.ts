import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { AUTH } from '../../../shared/tokens.js';
import type { Auth } from '../infrastructure/auth.js';

/**
 * Mounts better-auth's fetch handler under /v1/auth/* on the Fastify instance, bypassing Nest's
 * router (better-auth owns those routes; the community Nest module is Express-first — ADR-0007).
 */
export function mountAuth(app: NestFastifyApplication): void {
  const auth = app.get<Auth>(AUTH);
  const fastify = app.getHttpAdapter().getInstance();
  fastify.route({
    method: ['GET', 'POST'],
    url: '/v1/auth/*',
    handler: async (request, reply) => {
      const url = new URL(
        request.url,
        `${request.protocol}://${request.headers.host ?? 'localhost'}`,
      );
      const headers = fromNodeHeaders(request.headers);
      const body = request.body === undefined || request.body === null ? undefined : request.body;
      const response = await auth.handler(
        new Request(url.toString(), {
          method: request.method,
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        }),
      );
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key === 'set-cookie') return;
        reply.header(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header('set-cookie', cookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });
}

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { LightMyRequestResponse } from 'fastify';

/** Minimal cookie-jar client over Fastify inject(); one instance per simulated browser/device. */
export class TestClient {
  private readonly cookies = new Map<string, string>();
  bearer: string | undefined;

  constructor(private readonly app: NestFastifyApplication) {}

  async call(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<LightMyRequestResponse> {
    const headers: Record<string, string> = { ...extraHeaders };
    if (this.cookies.size) {
      headers['cookie'] = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    }
    if (this.bearer) headers['authorization'] = `Bearer ${this.bearer}`;
    const res = await this.app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method,
        url,
        headers,
        ...(body !== undefined ? { payload: body } : {}),
      });
    this.absorbCookies(res.headers['set-cookie']);
    return res;
  }

  private absorbCookies(raw: string | string[] | undefined): void {
    const lines = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const line of lines) {
      const parsed = parseSetCookie(line);
      if (!parsed) continue;
      if (parsed.expired) this.cookies.delete(parsed.name);
      else this.cookies.set(parsed.name, parsed.value);
    }
  }

  get(url: string, headers?: Record<string, string>) {
    return this.call('GET', url, undefined, headers);
  }

  post(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.call('POST', url, body, headers);
  }
}

function parseSetCookie(line: string): { name: string; value: string; expired: boolean } | null {
  const [pair] = line.split(';');
  const eq = pair?.indexOf('=') ?? -1;
  if (!pair || eq < 0) return null;
  const value = pair.slice(eq + 1);
  return { name: pair.slice(0, eq), value, expired: value === '' || /max-age=0/i.test(line) };
}

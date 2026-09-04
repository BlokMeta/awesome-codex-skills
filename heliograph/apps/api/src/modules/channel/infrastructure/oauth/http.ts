import { ProviderHttpError } from '../../application/provider-errors.js';

/** Minimal fetch surface the adapters need; tests substitute a fake, production uses global fetch. */
export type HttpFetch = (input: string, init?: RequestInit) => Promise<Response>;

/** Parses JSON, or throws ProviderHttpError with the raw body for non-2xx responses. */
export async function jsonOrThrow<T>(platform: string, res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) throw new ProviderHttpError(res.status, text.slice(0, 500), platform);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ProviderHttpError(res.status, `non-JSON body: ${text.slice(0, 100)}`, platform);
  }
}

export const form = (fields: Record<string, string | undefined>): string =>
  new URLSearchParams(
    Object.entries(fields).filter((e): e is [string, string] => e[1] !== undefined),
  ).toString();

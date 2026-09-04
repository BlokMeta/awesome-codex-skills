import type { Platform } from '@heliograph/domain';

/** A platform API answered with a non-2xx status; the body excerpt goes into `lastError`. */
export class ProviderHttpError extends Error {
  constructor(
    readonly status: number,
    readonly bodyText: string,
    readonly platform: string,
  ) {
    super(`${platform} returned ${status}`);
    this.name = 'ProviderHttpError';
  }
}

/** The deployment lacks this platform's client credentials (docs/14 A3–A7). */
export class ProviderNotConfiguredError extends Error {
  constructor(
    readonly platform: Platform,
    readonly envVars: readonly string[],
  ) {
    super(`${platform} OAuth client is not configured (${envVars.join(', ')})`);
    this.name = 'ProviderNotConfiguredError';
  }
}

import { z } from 'zod';

const AuthEnvSchema = z.object({
  HG_APP_SECRET: z.string().min(32, 'HG_APP_SECRET must be at least 32 characters'),
  HG_PUBLIC_API_URL: z.string().url(),
  HG_PUBLIC_WEB_URL: z.string().url(),
  HG_MOBILE_SCHEME: z
    .string()
    .regex(/^[a-z][a-z0-9+.-]*$/)
    .default('heliograph'),
  HG_AUTH_REQUIRE_EMAIL_VERIFICATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  NODE_ENV: z.string().default('development'),
});

export interface AuthConfig {
  readonly secret: string;
  readonly apiUrl: string;
  readonly webUrl: string;
  readonly mobileScheme: string;
  readonly requireEmailVerification: boolean;
  readonly production: boolean;
}

/** Reads and validates the auth-related environment (docs/14 A1, `pnpm doctor`). */
export function readAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const e = AuthEnvSchema.parse(env);
  return {
    secret: e.HG_APP_SECRET,
    apiUrl: e.HG_PUBLIC_API_URL,
    webUrl: e.HG_PUBLIC_WEB_URL,
    mobileScheme: e.HG_MOBILE_SCHEME,
    requireEmailVerification: e.HG_AUTH_REQUIRE_EMAIL_VERIFICATION,
    production: e.NODE_ENV === 'production',
  };
}

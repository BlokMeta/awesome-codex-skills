'use client';

import { passkeyClient } from '@better-auth/passkey/client';
import { organizationClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { AUTH_URL } from './env';

/**
 * better-auth client (ADR-0007). Cookies are HttpOnly and cross-origin to the API, so every
 * request goes out with credentials; the API's trustedOrigins allows the web origin.
 */
export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  fetchOptions: { credentials: 'include' },
  plugins: [organizationClient(), twoFactorClient(), passkeyClient()],
});

export type AuthClient = typeof authClient;
export const { useSession } = authClient;

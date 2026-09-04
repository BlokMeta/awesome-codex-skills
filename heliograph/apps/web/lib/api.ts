'use client';

import { type Contract, contract } from '@heliograph/contracts';
import { createORPCClient } from '@orpc/client';
import type { ContractRouterClient } from '@orpc/contract';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { API_URL } from './env';

/** Typed client generated from the contract (rule 6): one instance for the whole app. */
const link = new OpenAPILink(contract, {
  url: API_URL,
  fetch: (request, init) => globalThis.fetch(request, { ...init, credentials: 'include' }),
});

export const api: ContractRouterClient<Contract> = createORPCClient(link);

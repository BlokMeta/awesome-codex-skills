import { oc } from '@orpc/contract';
import { meContract } from './identity/me.js';
import { configHealthContract, healthContract } from './system/health.js';

export * from './common/pagination.js';
export * from './common/problem.js';
export * from './identity/me.js';
export * from './system/health.js';

/** Root contract: implemented by apps/api, consumed by web and mobile through a typed client. */
export const contract = oc.router({
  system: {
    health: healthContract,
    configHealth: configHealthContract,
  },
  identity: {
    me: meContract,
  },
});

export type Contract = typeof contract;

import { oc } from '@orpc/contract';
import { entitlementsContract } from './billing/entitlements.js';
import { meContract } from './identity/me.js';
import {
  acceptConsentsContract,
  consentStatusContract,
  withdrawConsentContract,
} from './privacy/consents.js';
import { configHealthContract, healthContract } from './system/health.js';

export * from './billing/entitlements.js';
export * from './common/pagination.js';
export * from './common/problem.js';
export * from './identity/me.js';
export * from './privacy/consents.js';
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
  billing: {
    entitlements: entitlementsContract,
  },
  privacy: {
    consentStatus: consentStatusContract,
    acceptConsents: acceptConsentsContract,
    withdrawConsent: withdrawConsentContract,
  },
});

export type Contract = typeof contract;

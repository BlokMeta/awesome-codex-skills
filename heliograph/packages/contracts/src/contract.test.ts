import { describe, expect, it } from 'vitest';
import { contract, HealthResponseSchema, ProblemSchema, problemType } from './index.js';

describe('contract', () => {
  it('exposes the system routes under /v1', () => {
    expect(contract.system.health['~orpc'].route?.path).toBe('/v1/health');
    expect(contract.system.configHealth['~orpc'].route?.path).toBe('/v1/health/config');
    expect(contract.identity.me['~orpc'].route?.path).toBe('/v1/me');
    expect(contract.billing.entitlements['~orpc'].route?.path).toBe('/v1/billing/entitlements');
    expect(contract.privacy.acceptConsents['~orpc'].route?.method).toBe('POST');
  });

  it('health response requires the stale-config counter (ADR-0011)', () => {
    const ok = HealthResponseSchema.safeParse({
      status: 'ok',
      version: '0.0.1',
      checkedAt: new Date().toISOString(),
      dependencies: [{ name: 'postgres', status: 'ok', latencyMs: 3 }],
      staleConfigKeys: 0,
    });
    expect(ok.success).toBe(true);
    const missing = HealthResponseSchema.safeParse({
      status: 'ok',
      version: '0.0.1',
      checkedAt: new Date().toISOString(),
      dependencies: [],
    });
    expect(missing.success).toBe(false);
  });

  it('problem details carry machine code and i18n message id', () => {
    const problem = ProblemSchema.parse({
      type: problemType('quota-exceeded'),
      title: 'Quota exceeded',
      status: 429,
      code: 'channel.quota_exceeded',
      messageId: 'errors.channel.quotaExceeded',
      requestId: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1',
    });
    expect(problem.type).toBe('https://heliograph.app/problems/quota-exceeded');
  });
});

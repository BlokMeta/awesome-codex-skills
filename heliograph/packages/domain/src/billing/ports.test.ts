import { describe, expect, it } from 'vitest';
import { FeatureSchema } from './entitlement.js';
import { ENTITLED_STATUSES, FEATURE_KIND } from './ports.js';

describe('feature kinds', () => {
  it('classifies every feature exactly once', () => {
    for (const f of FeatureSchema.options) expect(FEATURE_KIND[f]).toBeDefined();
    expect(Object.keys(FEATURE_KIND).sort()).toEqual([...FeatureSchema.options].sort());
  });

  it('keeps entitlements during dunning but not after cancellation', () => {
    expect(ENTITLED_STATUSES).toContain('past_due');
    expect(ENTITLED_STATUSES).not.toContain('cancelled');
  });
});

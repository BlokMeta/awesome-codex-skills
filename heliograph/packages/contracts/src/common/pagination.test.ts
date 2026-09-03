import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  decodeCursor,
  encodeCursor,
  PAGE_LIMIT_DEFAULT,
  PAGE_LIMIT_MAX,
  PageQuerySchema,
  pageOf,
} from './pagination.js';

describe('PageQuerySchema', () => {
  it('defaults limit and caps it at the maximum', () => {
    expect(PageQuerySchema.parse({})).toEqual({ limit: PAGE_LIMIT_DEFAULT });
    expect(PageQuerySchema.parse({ limit: '10' }).limit).toBe(10);
    expect(PageQuerySchema.safeParse({ limit: PAGE_LIMIT_MAX + 1 }).success).toBe(false);
    expect(PageQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });
});

describe('cursor codec', () => {
  it('round-trips any sort key and id', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer()), fc.string({ minLength: 1 }), (k, id) => {
        const decoded = decodeCursor(encodeCursor({ k, id }));
        expect(decoded).toEqual({ v: 1, k, id });
      }),
    );
  });

  it('rejects garbage, foreign JSON and future versions', () => {
    expect(decodeCursor('not-base64!!')).toBeNull();
    expect(decodeCursor(btoa('{"hello":"world"}'))).toBeNull();
    expect(decodeCursor(btoa('{"v":2,"k":1,"id":"x"}'))).toBeNull();
    expect(decodeCursor('')).toBeNull();
  });

  it('produces URL-safe output', () => {
    const cursor = encodeCursor({ k: 'zz??>>', id: '01J8Z3M9K2Q4R5S6T7V8W9X0Y1' });
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('pageOf', () => {
  it('builds the canonical list envelope', () => {
    const schema = pageOf(z.object({ id: z.string() }));
    const parsed = schema.parse({
      data: [{ id: 'a' }],
      page: { nextCursor: null, prevCursor: null, limit: 25, hasMore: false },
      meta: { requestId: '01J' },
    });
    expect(parsed.data).toHaveLength(1);
    expect(schema.safeParse({ data: [], page: {}, meta: {} }).success).toBe(false);
  });
});

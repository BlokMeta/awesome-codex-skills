import { z } from 'zod';

/**
 * Opaque cursor pagination — the only list shape in the API (docs/05 §2, ADR-0008).
 * The cursor encodes { v: version, k: sort key, id } as base64url JSON.
 */
export const PAGE_LIMIT_DEFAULT = 25;
export const PAGE_LIMIT_MAX = 100;

export const PageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT),
  cursor: z.string().min(1).optional(),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;

export const PageInfoSchema = z.object({
  nextCursor: z.string().nullable(),
  prevCursor: z.string().nullable(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});
export type PageInfo = z.infer<typeof PageInfoSchema>;

export const ResponseMetaSchema = z.object({ requestId: z.string() });

export function pageOf<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    page: PageInfoSchema,
    meta: ResponseMetaSchema,
  });
}

export const CursorPayloadSchema = z.object({
  v: z.literal(1),
  k: z.union([z.string(), z.number()]),
  id: z.string(),
});
export type CursorPayload = z.infer<typeof CursorPayloadSchema>;

const toBase64Url = (s: string): string =>
  btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string): string => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
};

export function encodeCursor(payload: Omit<CursorPayload, 'v'>): string {
  return toBase64Url(JSON.stringify({ v: 1, ...payload }));
}

/** Returns null for malformed or foreign cursors; callers map that to 400 invalid_cursor. */
export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(cursor));
    const result = CursorPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

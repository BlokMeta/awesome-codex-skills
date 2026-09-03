import { ulid } from 'ulid';
import { z } from 'zod';

/** ULID string; all identifiers in the system use it (docs/05 §1). */
export const IdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'invalid ulid');
export type Id = z.infer<typeof IdSchema>;

export interface IdGenerator {
  next(): Id;
}

export const ulidGenerator: IdGenerator = { next: () => ulid() };

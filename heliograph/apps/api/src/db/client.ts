import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Schema = typeof schema;
/** Driver-agnostic handle every repository depends on (postgres.js in prod, PGlite in tests). */
export type Database = PgDatabase<PgQueryResultHKT, Schema>;

export interface DatabaseHandle {
  readonly db: Database;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export const MIGRATIONS_FOLDER = new URL('../../drizzle', import.meta.url).pathname;

export function createPostgresDatabase(url: string, opts: { max?: number } = {}): DatabaseHandle {
  const client = postgres(url, { max: opts.max ?? 10, prepare: false });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  return {
    db,
    migrate: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => client.end({ timeout: 5 }),
  };
}

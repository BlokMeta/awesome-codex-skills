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

/**
 * `HG_DATABASE_URL` selects the driver: `postgres://…` (production, CI) or `pglite://<dir>`
 * (in-process Postgres for local development and e2e runs without a server; `pglite://` alone
 * keeps everything in memory). Both run the same migrations and RLS policies (ADR-0014).
 */
export async function openDatabase(url: string): Promise<DatabaseHandle> {
  if (url.startsWith('pglite://')) return createPgliteDatabase(url.slice('pglite://'.length));
  return createPostgresDatabase(url);
}

export async function createPgliteDatabase(dataDir = ''): Promise<DatabaseHandle> {
  const [{ PGlite }, { drizzle: drizzlePglite }, { migrate: migratePglite }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('drizzle-orm/pglite/migrator'),
  ]);
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzlePglite(client, { schema, casing: 'snake_case' });
  return {
    db: db as unknown as Database,
    migrate: () => migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => client.close(),
  };
}

export function createPostgresDatabase(url: string, opts: { max?: number } = {}): DatabaseHandle {
  const client = postgres(url, { max: opts.max ?? 10, prepare: false });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  return {
    db,
    migrate: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => client.end({ timeout: 5 }),
  };
}

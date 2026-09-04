import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import {
  createPostgresDatabase,
  type Database,
  type DatabaseHandle,
  MIGRATIONS_FOLDER,
} from '../../src/db/client.js';
import * as schema from '../../src/db/schema.js';

/**
 * Integration tests run against real Postgres semantics either way: an in-process PGlite
 * (default, no infra) or the server named by HG_TEST_DATABASE_URL (CI service container).
 * With a server, each call gets its own database so test files can run in parallel.
 */
export async function createTestDatabase(): Promise<DatabaseHandle> {
  const url = process.env['HG_TEST_DATABASE_URL'];
  const handle = url ? await isolatedPostgres(url) : await pglite();
  await handle.migrate();
  return handle;
}

async function pglite(): Promise<DatabaseHandle> {
  const client = new PGlite();
  const db = drizzle(client, { schema, casing: 'snake_case' }) as unknown as Database;
  return {
    db,
    migrate: () =>
      migrate(db as unknown as Parameters<typeof migrate>[0], {
        migrationsFolder: MIGRATIONS_FOLDER,
      }),
    close: () => client.close(),
  };
}

async function isolatedPostgres(url: string): Promise<DatabaseHandle> {
  const name = `hg_test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = createPostgresDatabase(url, { max: 1 });
  await admin.db.execute(`CREATE DATABASE "${name}"`);
  await admin.close();
  const u = new URL(url);
  u.pathname = `/${name}`;
  const handle = createPostgresDatabase(u.toString(), { max: 2 });
  return {
    db: handle.db,
    migrate: handle.migrate,
    close: async () => {
      await handle.close();
      const cleanup = createPostgresDatabase(url, { max: 1 });
      await cleanup.db.execute(`DROP DATABASE "${name}" WITH (FORCE)`);
      await cleanup.close();
    },
  };
}

/** Drizzle wraps driver errors ("Failed query: …") and keeps the Postgres error in `cause`. */
export async function expectRlsViolation(p: Promise<unknown>): Promise<void> {
  let caught: unknown;
  try {
    await p;
  } catch (e) {
    caught = e;
  }
  if (!caught) throw new Error('expected a row-level security violation, query succeeded');
  const messages = [caught, (caught as { cause?: unknown }).cause]
    .filter(Boolean)
    .map((e) => (e instanceof Error ? e.message : String(e)))
    .join(' | ');
  if (!/row-level security/.test(messages)) throw new Error(`not an RLS violation: ${messages}`);
}

/** `execute()` returns an array (postgres.js) or `{ rows }` (PGlite); normalise for assertions. */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows: T[] }).rows;
}

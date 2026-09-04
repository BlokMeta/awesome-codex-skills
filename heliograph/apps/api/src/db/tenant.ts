import { sql } from 'drizzle-orm';
import type { Database } from './client.js';

/** Postgres accepts only simple identifiers here; ULIDs and test ids qualify. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Runs `fn` inside a transaction where Row Level Security is in force for one workspace:
 * the connection switches to the non-superuser `hg_app` role and publishes the tenant id via
 * `hg.workspace_id`, which every tenant policy compares against (docs/11, docs/08 §2).
 * `SET LOCAL` scopes both settings to the transaction, so pooled connections never leak a tenant.
 */
export async function withWorkspace<T>(
  db: Database,
  workspaceId: string,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  if (!SAFE_ID.test(workspaceId)) throw new Error('invalid workspace id');
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE hg_app`);
    await tx.execute(sql.raw(`SET LOCAL hg.workspace_id = '${workspaceId}'`));
    return fn(tx as unknown as Database);
  });
}

/**
 * Operations that legitimately span tenants (login: "which workspaces am I in", the staleness
 * watcher, admin tooling). They run as the connection's own role with RLS not applied; every call
 * site must be reviewable, hence the required `reason`.
 */
export async function withoutTenant<T>(
  db: Database,
  _reason: string,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => fn(tx as unknown as Database));
}

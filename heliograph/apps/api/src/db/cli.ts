import { DrizzlePolicyRepository } from '../modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from '../modules/config/infrastructure/seed.js';
import { createPostgresDatabase } from './client.js';

/** `pnpm db:migrate` / `pnpm db:seed` — the same code path bootstrap uses when HG_DB_AUTO_MIGRATE=true. */
async function main(command: string | undefined): Promise<void> {
  const url = process.env['HG_DATABASE_URL'];
  if (!url) throw new Error('HG_DATABASE_URL is required');
  const handle = createPostgresDatabase(url, { max: 1 });
  try {
    if (command === 'migrate') {
      await handle.migrate();
    } else if (command === 'seed') {
      const inserted = await new DrizzlePolicyRepository(handle.db).seedIfMissing(
        seedEntries(new Date()),
      );
      console.error(`seeded ${inserted} policy entries`);
    } else {
      throw new Error(`unknown command: ${command ?? '(none)'} — use migrate | seed`);
    }
  } finally {
    await handle.close();
  }
}

main(process.argv[2]).catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});

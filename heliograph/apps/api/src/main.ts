import { createApp } from './bootstrap.js';
import { createPostgresDatabase } from './db/client.js';
import { DrizzlePolicyRepository } from './modules/config/infrastructure/drizzle-policy.repository.js';
import { seedEntries } from './modules/config/infrastructure/seed.js';

const url = process.env['HG_DATABASE_URL'];
if (!url) throw new Error('HG_DATABASE_URL is required (run `pnpm doctor`)');

const handle = createPostgresDatabase(url);
if ((process.env['HG_DB_AUTO_MIGRATE'] ?? 'true') === 'true') {
  await handle.migrate();
  await new DrizzlePolicyRepository(handle.db).seedIfMissing(seedEntries(new Date()));
}

const app = await createApp({ db: handle.db, schedule: true });
const port = Number(process.env['HG_API_PORT'] ?? 4000);
await app.listen({ port, host: '0.0.0.0' });

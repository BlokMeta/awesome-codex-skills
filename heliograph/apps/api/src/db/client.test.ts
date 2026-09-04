import { describe, expect, it } from 'vitest';
import { createPostgresDatabase, MIGRATIONS_FOLDER } from './client.js';

describe('createPostgresDatabase', () => {
  it('builds a lazy handle (no connection until first query) that closes cleanly', async () => {
    const handle = createPostgresDatabase('postgres://nobody@127.0.0.1:1/none', { max: 1 });
    expect(handle.db).toBeDefined();
    await expect(handle.close()).resolves.toBeUndefined();
  });

  it('points at the committed migrations folder', () => {
    expect(MIGRATIONS_FOLDER.endsWith('/drizzle')).toBe(true);
  });
});

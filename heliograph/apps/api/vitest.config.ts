import { vitestBase } from '@heliograph/config/vitest.base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...vitestBase,
  test: {
    ...vitestBase.test,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // PGlite boots a Postgres per test file; parallel files share the CPU.
    hookTimeout: 60_000,
    testTimeout: 30_000,
    coverage: {
      ...vitestBase.test?.coverage,
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/main.ts', 'src/db/cli.ts'],
      thresholds: { lines: 85, branches: 75, functions: 85, statements: 85 },
    },
  },
});

import type { UserConfig } from 'vitest/config';

/**
 * Shared Vitest defaults. Packages extend this and only override coverage thresholds
 * when their layer demands it (see docs/04-test-ve-kalite.md §1).
 */
export const vitestBase: UserConfig = {
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
};

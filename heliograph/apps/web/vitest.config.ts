import { resolve } from 'node:path';
import { vitestBase } from '@heliograph/config/vitest.base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...vitestBase,
  resolve: { alias: { '@': resolve(import.meta.dirname) } },
  esbuild: { jsx: 'automatic' },
  test: {
    ...vitestBase.test,
    environment: 'jsdom',
    include: ['components/**/*.test.tsx', 'lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    setupFiles: ['test/setup.ts'],
    css: false,
    coverage: {
      ...vitestBase.test?.coverage,
      include: ['components/**/*.tsx', 'lib/**/*.ts', 'lib/**/*.tsx', 'proxy.ts'],
      exclude: ['**/*.test.*'],
      thresholds: { lines: 70, branches: 60, functions: 70, statements: 70 },
    },
  },
});

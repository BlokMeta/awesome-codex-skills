import { vitestBase } from '@heliograph/config/vitest.base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...vitestBase,
  test: {
    ...vitestBase.test,
    environment: 'jsdom',
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    css: true,
    coverage: {
      ...vitestBase.test?.coverage,
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['src/**/*.test.tsx', 'src/**/*.stories.tsx', 'src/**/index.ts', 'src/props/**'],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
});

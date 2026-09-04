import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 4100;
const apiUrl = `http://127.0.0.1:${API_PORT}`;
const webUrl = `http://127.0.0.1:${WEB_PORT}`;

/**
 * E2E "giriş" flow (docs/04 §6). The API runs on an in-process PGlite database
 * (HG_DATABASE_URL=pglite://) so no external service is needed; the web app is built once.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    locale: 'tr-TR',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Sandboxes that ship their own Chromium point at it; CI installs the pinned build.
        ...(process.env['HG_E2E_CHROMIUM_PATH']
          ? { launchOptions: { executablePath: process.env['HG_E2E_CHROMIUM_PATH'] } }
          : {}),
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @heliograph/api build && pnpm --filter @heliograph/api start',
      url: `${apiUrl}/v1/health`,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
      env: {
        HG_DATABASE_URL: 'pglite://',
        HG_DB_AUTO_MIGRATE: 'true',
        HG_APP_SECRET: 'e2e-secret-e2e-secret-e2e-secret-0123456789',
        HG_ENCRYPTION_MASTER_KEY: 'ZTJlLW1hc3Rlci1rZXktZTJlLW1hc3Rlci1rZXktMDE=',
        HG_PUBLIC_API_URL: apiUrl,
        HG_PUBLIC_WEB_URL: webUrl,
        HG_API_PORT: String(API_PORT),
        HG_LOG_LEVEL: 'warn',
        NODE_ENV: 'development',
      },
    },
    {
      command: `pnpm exec next start -p ${WEB_PORT}`,
      url: webUrl,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
      env: { HG_PUBLIC_API_URL: apiUrl },
    },
  ],
});

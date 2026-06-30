import { defineConfig } from '@playwright/test';

const webPort = process.env.PW_WEB_SERVER_PORT || '4173';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${webPort}`;
const forceFreshServer = process.env.PW_FORCE_FRESH_SERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: 'playwright-report' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  webServer: {
    command: `bun run dev -- --host 127.0.0.1 --port ${webPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !forceFreshServer && !process.env.CI,
    timeout: 120_000
  }
});

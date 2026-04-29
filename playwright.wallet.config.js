import { defineConfig } from '@playwright/test';

const baseURL = process.env.PW_WALLET_BASE_URL || 'http://127.0.0.1:4173';
const webServerURL = process.env.PW_WALLET_WEBSERVER_URL || baseURL;
const webServerCommand =
  process.env.PW_WALLET_WEBSERVER_COMMAND ||
  'bun run dev -- --host 127.0.0.1 --port 4173';

const extensionPath = process.env.PW_WALLET_EXTENSION_PATH?.trim() || '';
const extensionId = process.env.PW_WALLET_EXTENSION_ID?.trim() || '';
const walletName = process.env.PW_WALLET_NAME?.trim() || 'MetaMask';
const walletTestAddress = process.env.PW_WALLET_TEST_ADDRESS?.trim() || '';
const walletHeadless = /^(1|true)$/i.test(process.env.PW_WALLET_HEADLESS || '');
const skipWebServer = /^(1|true)$/i.test(process.env.PW_WALLET_SKIP_WEBSERVER || '');

export default defineConfig({
  testDir: './tests/e2e-wallet',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-wallet-report' }]]
    : 'list',
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  metadata: {
    walletExtensionPath: extensionPath || null,
    walletExtensionId: extensionId || null,
    walletName,
    walletTestAddress: walletTestAddress || null,
    walletHeadless,
    walletConnectPath: process.env.PW_WALLET_CONNECT_PATH?.trim() || '/earn',
    walletExtensionTimeoutMs: Number.parseInt(process.env.PW_WALLET_EXTENSION_TIMEOUT_MS || '15000', 10)
  },
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: webServerCommand,
        url: webServerURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      }
});

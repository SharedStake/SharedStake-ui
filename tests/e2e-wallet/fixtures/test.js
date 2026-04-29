import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import {
  launchPersistentWalletContext,
  resolveWalletConfig
} from './walletContext.js';

export const test = base.extend({
  walletConfig: async ({}, use, testInfo) => {
    await use(resolveWalletConfig(testInfo.config));
  },

  context: async ({ walletConfig }, use) => {
    const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'playwright-wallet-'));
    const context = await launchPersistentWalletContext({
      userDataDir,
      extensionPath: walletConfig.extensionPath,
      extensionId: walletConfig.extensionId,
      headless: walletConfig.headless,
      extensionTimeoutMs: walletConfig.extensionTimeoutMs
    });

    try {
      await use(context);
    } finally {
      await context.close();
      await rm(userDataDir, { recursive: true, force: true });
    }
  },

  page: async ({ context }, use) => {
    const page = context.pages()[0] || (await context.newPage());
    await use(page);
  }
});

export { expect };

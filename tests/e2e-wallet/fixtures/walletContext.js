import { chromium } from '@playwright/test';

const TRUE_RE = /^(1|true)$/i;

const parseBoolean = (value, fallback = false) => {
  if (value == null || value === '') {
    return fallback;
  }
  return TRUE_RE.test(String(value));
};

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const resolveString = (envValue, metadataValue, fallback = '') => {
  if (typeof envValue === 'string' && envValue.trim()) {
    return envValue.trim();
  }
  if (typeof metadataValue === 'string' && metadataValue.trim()) {
    return metadataValue.trim();
  }
  return fallback;
};

export function resolveWalletConfig(config = {}) {
  const metadata = config.metadata || {};

  const extensionPath = resolveString(
    process.env.PW_WALLET_EXTENSION_PATH,
    metadata.walletExtensionPath
  );
  const extensionId = resolveString(
    process.env.PW_WALLET_EXTENSION_ID,
    metadata.walletExtensionId
  );
  const walletName = resolveString(
    process.env.PW_WALLET_NAME,
    metadata.walletName,
    'MetaMask'
  );
  const testAddress = resolveString(
    process.env.PW_WALLET_TEST_ADDRESS,
    metadata.walletTestAddress
  );
  const connectPath = resolveString(
    process.env.PW_WALLET_CONNECT_PATH,
    metadata.walletConnectPath,
    '/earn'
  );

  const headless = parseBoolean(
    process.env.PW_WALLET_HEADLESS,
    parseBoolean(metadata.walletHeadless, false)
  );
  const extensionTimeoutMs = parseInteger(
    process.env.PW_WALLET_EXTENSION_TIMEOUT_MS || metadata.walletExtensionTimeoutMs,
    15_000
  );

  const missingRequiredEnv = [];
  if (!extensionPath) {
    missingRequiredEnv.push('PW_WALLET_EXTENSION_PATH');
  }
  if (!extensionId) {
    missingRequiredEnv.push('PW_WALLET_EXTENSION_ID');
  }
  if (!testAddress) {
    missingRequiredEnv.push('PW_WALLET_TEST_ADDRESS');
  }

  return {
    extensionPath,
    extensionId,
    walletName,
    testAddress,
    connectPath,
    headless,
    extensionTimeoutMs,
    missingRequiredEnv
  };
}

const buildExtensionArgs = (extensionPath) => {
  if (!extensionPath) {
    return [];
  }
  return [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`
  ];
};

export async function waitForExtensionServiceWorker(
  context,
  extensionId,
  timeoutMs = 15_000
) {
  const extensionPrefix = `chrome-extension://${extensionId}/`;
  const hasExtensionWorker = () =>
    context.serviceWorkers().some((worker) => worker.url().startsWith(extensionPrefix));

  if (hasExtensionWorker()) {
    return true;
  }

  try {
    await context.waitForEvent('serviceworker', {
      timeout: timeoutMs,
      predicate: (worker) => worker.url().startsWith(extensionPrefix)
    });
    return true;
  } catch {
    return hasExtensionWorker();
  }
}

export async function launchPersistentWalletContext({
  userDataDir,
  extensionPath,
  extensionId,
  headless = false,
  extensionTimeoutMs = 15_000,
  launchOptions = {}
}) {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless,
    args: buildExtensionArgs(extensionPath),
    viewport: {
      width: 1440,
      height: 900
    },
    ...launchOptions
  });

  if (extensionPath && extensionId) {
    await waitForExtensionServiceWorker(context, extensionId, extensionTimeoutMs);
  }

  return context;
}

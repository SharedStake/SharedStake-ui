import { test, expect } from './fixtures/test.js';

const TRUE_RE = /^(1|true)$/i;
const requireRealConnect = TRUE_RE.test(process.env.PW_WALLET_ENFORCE_REAL_CONNECT || '');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const withE2EAddress = (path, address) => {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}e2eAddress=${address}`;
};

const asTruncatedAddressPattern = (address) => {
  const prefix = escapeRegExp(address.slice(0, 4));
  const suffix = escapeRegExp(address.slice(-4));
  return new RegExp(`${prefix}\\.\\.\\.${suffix}`, 'i');
};

test.describe('wallet extension connect flow', () => {
  test.beforeEach(async ({ walletConfig }) => {
    test.skip(
      walletConfig.missingRequiredEnv.length > 0,
      `Missing wallet env: ${walletConfig.missingRequiredEnv.join(', ')}`
    );
  });

  test('wallet connect path renders and connected account is visible', async ({
    page,
    context,
    walletConfig
  }) => {
    await page.goto(walletConfig.connectPath, { waitUntil: 'domcontentloaded' });

    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    const walletOption = page
      .getByRole('button', {
        name: new RegExp(escapeRegExp(walletConfig.walletName), 'i')
      })
      .first();
    await expect(walletOption).toBeVisible({ timeout: 15_000 });
    await walletOption.click();

    const extensionPrefix = `chrome-extension://${walletConfig.extensionId}/`;
    await expect
      .poll(
        () =>
          context
            .serviceWorkers()
            .some((worker) => worker.url().startsWith(extensionPrefix)),
        { timeout: walletConfig.extensionTimeoutMs }
      )
      .toBeTruthy();

    const accountButton = page.locator('button.btn-connect').first();
    if (requireRealConnect) {
      await expect(accountButton).toBeVisible({ timeout: walletConfig.extensionTimeoutMs });
      await expect(accountButton).toContainText(
        asTruncatedAddressPattern(walletConfig.testAddress)
      );
      return;
    }

    await page.goto(withE2EAddress(walletConfig.connectPath, walletConfig.testAddress), {
      waitUntil: 'networkidle'
    });

    await expect(accountButton).toBeVisible();
    await expect(accountButton).toContainText(
      asTruncatedAddressPattern(walletConfig.testAddress)
    );
  });
});

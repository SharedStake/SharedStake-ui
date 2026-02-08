import { test, expect } from '@playwright/test';

const AIRDROP_ADDRESS = '0x0034daf2e65F6ef82Bc6F893dbBfd7c232a0e59C';

const getClaimStatus = async (page) => {
  const status = page.locator('.poolClaim');
  await expect(status).toBeVisible();
  return status;
};

test('airdrop mock flow shows available and can claim', async ({ page }) => {
  await page.goto(`/earn?e2eAddress=${AIRDROP_ADDRESS}`, { waitUntil: 'networkidle' });

  const addressInput = page.locator('input[title="address"]');
  await addressInput.scrollIntoViewIfNeeded();
  await expect(addressInput).toBeVisible({ timeout: 10_000 });
  await addressInput.fill(AIRDROP_ADDRESS);

  const status = await getClaimStatus(page);
  await expect(status).toContainText('Available');

  const claimButton = page.getByRole('button', { name: 'Claim' });
  await expect(claimButton).toBeVisible();
  await claimButton.click();

  await expect(status).toContainText('Claimed');
});

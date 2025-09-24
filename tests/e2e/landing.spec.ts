import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
     test('loads homepage and shows navbar and footer text', async ({ page }) => {
         await page.route('https://api.coingecko.com/**', async route => {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ 'sharedstake-governance-token': { usd: 0 } }) });
         });
         await page.goto('/');
		 await expect(page.locator('#app')).toBeVisible();
		 await expect(page.locator('header, .navbar')).toBeVisible();
		 await expect(page.getByRole('link', { name: /SharedStake/i })).toBeVisible();
		 await expect(page.locator('text=Get ready for V2!')).toBeVisible();
	 });
});


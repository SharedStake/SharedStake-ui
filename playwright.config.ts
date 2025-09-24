import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	 testDir: './tests/e2e',
	 fullyParallel: true,
	 timeout: 120000,
	 retries: 0,
	 reporter: [['list']],
	 use: {
		 baseURL: 'http://localhost:8080',
		 headless: true,
	 },
    webServer: {
        // Build once and serve SPA with history fallback for stable E2E
        command: 'yarn build && npx --yes serve -s dist -l 8080',
		 port: 8080,
		 reuseExistingServer: true,
		 timeout: 600000,
	 },
	 projects: [
		 { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	 ],
});
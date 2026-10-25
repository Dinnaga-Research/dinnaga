// ABOUTME: Playwright config — runs e2e specs against the Vite dev server.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4242',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/{artifacts,weekly,responsive,doc-viewer}.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/{artifacts,weekly,responsive,doc-viewer}.spec.ts',
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:4242',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

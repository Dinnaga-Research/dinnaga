// ABOUTME: Playwright config: runs e2e specs against the Vite dev server on PORT (default 4242),
// ABOUTME: so parallel worktrees each test their own server. Firefox and WebKit run the listed specs.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4242);
const BASE_URL = `http://localhost:${PORT}`;
const CROSS_BROWSER =
  '**/{atisha,backstage,redirects,building,home,method,frames,chrome,icons,responsive,visual-lint,doc-viewer,doc-viewer-quartz,doc-theme}.spec.ts';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
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
      testMatch: CROSS_BROWSER,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: CROSS_BROWSER,
    },
  ],
  webServer: {
    command: `bunx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

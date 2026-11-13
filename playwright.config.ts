// ABOUTME: Playwright config: runs e2e specs against the Vite dev server on PORT (default 4242),
// ABOUTME: so parallel worktrees each test their own server. Firefox and WebKit run the listed specs.
// ABOUTME: The server runs with API_FIXTURES, so /api/* answers from tests/fixtures and never goes live.
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
    // scripts/vite-api-dev.ts serves /api/<name> from tests/fixtures/<name>/full.json in this mode.
    // Specs that need another state still page.route() it. routing.spec checks the server honours it.
    env: { API_FIXTURES: 'tests/fixtures' },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

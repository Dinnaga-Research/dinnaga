// ABOUTME: E2E — the dev-only /dev/doc harness route must be absent from a production build.
// ABOUTME: Builds into a temp dir and serves it with vite preview on PREVIEW_PORT (default 4243). Chromium only.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test.setTimeout(240_000);

const PREVIEW_PORT = Number(process.env.PREVIEW_PORT ?? Number(process.env.PORT ?? 4242) + 1);
const ORIGIN = `http://localhost:${PREVIEW_PORT}`;

let outDir = '';
let preview: ChildProcess | null = null;

test.afterAll(() => {
  preview?.kill();
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

test('the harness path returns the 404 page in a production build', async ({ page }) => {
  outDir = mkdtempSync(join(tmpdir(), 'dinnaga-prod-'));
  const build = spawnSync('bunx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  expect(build.status, build.stderr + build.stdout).toBe(0);

  // No harness code ships either
  const assets = join(outDir, 'assets');
  const bundle = readdirSync(assets)
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(join(assets, f), 'utf8'))
    .join('\n');
  expect(bundle).not.toContain('Dev harness');
  expect(bundle).not.toContain('kind:"Living document"');

  preview = spawn('bunx', ['vite', 'preview', '--outDir', outDir, '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  await expect
    .poll(async () => (await fetch(`${ORIGIN}/`).catch(() => null))?.status, { timeout: 30_000 })
    .toBe(200);

  await page.goto(`${ORIGIN}/dev/doc?path=%2F__fixtures__%2Fquartz%2Fbuild-b%2Findex.html`);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.locator('[data-doc-host]')).toHaveCount(0);
  await expect(page.getByText('Living document', { exact: true })).toHaveCount(0);
});

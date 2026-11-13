// ABOUTME: E2E for the artifacts shelf — index → viewer navigation and the static docs.
// ABOUTME: The shelf is unlisted; entry is the home-terminal passphrase or a direct URL.
import { expect, test } from '@playwright/test';

test('/artifacts lists the report and clicking navigates to the viewer', async ({ page }) => {
  await page.goto('/artifacts');
  await expect(page.getByText(/84-dish portfolio test kitchen/)).toBeVisible();
  await page.getByRole('link', { name: /SLAMWICH Tasting Report/ }).click();
  await expect(page).toHaveURL(/\/artifacts\/slamwich-tasting-report$/);
  await expect(
    page.getByRole('heading', { name: /What 84 rebuilds of 28 acclaimed portfolios/i }),
  ).toBeVisible();
});

test('deep link to the viewer resolves on hard load', async ({ page }) => {
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(
    page.getByRole('heading', { name: /What 84 rebuilds of 28 acclaimed portfolios/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /open standalone/i })).toHaveAttribute(
    'href',
    '/artifact-docs/slamwich-tasting-report.html',
  );
  // The catalogue title lives in the colophon, as plain text; the doc owns the h1.
  await expect(page.getByRole('heading', { level: 2, name: 'About this doc' })).toBeVisible();
  await expect(page.locator('footer strong', { hasText: 'SLAMWICH Tasting Report' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('the viewer mounts the actual report document in shadow DOM', async ({ page }) => {
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(
    page.getByRole('heading', {
      name: /What 84 rebuilds of 28 acclaimed portfolios teach about design/i,
    }),
  ).toBeVisible();
  await expect(page.locator('[data-doc-host]')).toHaveJSProperty('shadowRoot.mode', 'open');
});

test('the raw doc is served as a static file', async ({ page }) => {
  const res = await page.request.get('/artifact-docs/slamwich-tasting-report.html');
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toContain('<!doctype html>');
  expect(text).toContain('SLAMWICH Tasting Report');
});

test('renders exactly one main landmark on both artifact routes', async ({ page }) => {
  await page.goto('/artifacts');
  await expect(page.locator('main')).toHaveCount(1);
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(page.locator('main')).toHaveCount(1);
});

test('the home terminal passphrase unlocks the hidden shelf (reduced motion)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const input = page.getByLabel('Ask Dinnaga a question');
  await input.fill('show me what you got');
  await input.press('Enter');
  await expect(page.getByText('▸ ACCESS GRANTED — ROUTING TO /ARTIFACTS')).toBeVisible();
  await expect(page).toHaveURL(/\/artifacts$/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Documents off the bench.' })).toBeVisible();
});

test('the passphrase reveal plays through under full motion', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Ask Dinnaga a question');
  await input.fill("show me what you've got");
  await input.press('Enter');
  await expect(page.getByText('PASSPHRASE ACCEPTED.')).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/artifacts$/, { timeout: 15_000 });
});

test('the primary nav does not list the artifact shelf', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('.nav-links');
  await expect(nav.getByRole('link', { name: 'WEEKLY' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'ARTIFACTS' })).toHaveCount(0);
});

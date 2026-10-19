// ABOUTME: E2E for the /weekly run log and /weekly/:date viewer — list-to-viewer navigation,
// ABOUTME: deep-link load, the report iframe actually rendering, and the raw static doc fetch.
import { expect, test } from '@playwright/test';

test('/weekly lists the run and clicking navigates to the viewer', async ({ page }) => {
  await page.goto('/weekly');
  await expect(page.getByText(/scout\/cook\/judge design-portfolio pipeline/)).toBeVisible();
  await page.getByRole('link', { name: /Week in review — 2026-08-08/ }).click();
  await expect(page).toHaveURL(/\/weekly\/2026-08-08$/);
  await expect(
    page.getByRole('heading', { name: '3–8 Aug 2026' }),
  ).toBeVisible();
});

test('deep link to the viewer resolves on hard load', async ({ page }) => {
  await page.goto('/weekly/2026-08-08');
  await expect(
    page.getByRole('heading', { name: '3–8 Aug 2026' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /open standalone/i })).toHaveAttribute(
    'href',
    '/artifact-docs/weekly/2026-08-08.html',
  );
});

test('the viewer iframe loads the actual report document', async ({ page }) => {
  await page.goto('/weekly/2026-08-08');
  const frame = page.frameLocator('iframe[title="3–8 Aug 2026"]');
  await expect(frame.getByRole('heading', { name: /Your Week in Review/ })).toBeVisible();
});

test('the raw report is served as a static file', async ({ page }) => {
  const res = await page.request.get('/artifact-docs/weekly/2026-08-08.html');
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toContain('<!doctype html>');
  expect(text).toContain('Week in Review');
});

test('/weekly shows paused message', async ({ page }) => {
  await page.goto('/weekly');
  await expect(page.getByText('Paused since 26 Sep 2026.')).toBeVisible();
});

test('renders exactly one main landmark on both weekly routes', async ({ page }) => {
  await page.goto('/weekly');
  await expect(page.locator('main')).toHaveCount(1);
  await page.goto('/weekly/2026-08-08');
  await expect(page.locator('main')).toHaveCount(1);
});

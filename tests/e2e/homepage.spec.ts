import { expect, test } from '@playwright/test';

test('renders the homepage hero and lab sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Validated, then shared.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How the lab works.' })).toBeVisible();
  await expect(page.getByText(/© 2026 DINNAGA/)).toBeVisible();
});

test('has no analytics banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Decline' })).toHaveCount(0);
  await expect(page.getByText(/analytics/i)).toHaveCount(0);
});

test('removes the travelling green square after the mount animation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.green-square')).toHaveCount(0, { timeout: 3000 });
});

test('nav links route between pages', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-links').getByRole('link', { name: 'ATISHA' }).click();
  await expect(page).toHaveURL(/\/atisha$/);
  // Atisha heading is asserted in routing.spec.ts once Phase 3 builds the page.
});

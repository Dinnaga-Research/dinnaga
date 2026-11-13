// ABOUTME: E2E accessibility floors: the skip link, one main landmark, lang="en".
import { expect, test } from '@playwright/test';

test('exposes a skip-to-content link to #main', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('link', { name: /skip to content/i });
  await expect(skip).toHaveAttribute('href', '#main');
  await expect(page.locator('#main')).toHaveCount(1);
});

for (const path of ['/', '/atisha', '/backstage/weekly', '/no-such-page']) {
  test(`${path} renders exactly one main landmark and declares English`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  });
}

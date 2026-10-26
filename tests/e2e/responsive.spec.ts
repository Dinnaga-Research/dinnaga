import { expect, test } from '@playwright/test';

const MOBILE = { width: 375, height: 812 };

async function hasHorizontalOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}

test('home renders without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

test('home renders without horizontal overflow at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await hasHorizontalOverflow(page)).toBe(false);
});

for (const path of [
  '/atisha',
  '/method',
  '/colophon',
  '/artifacts',
  '/artifacts/slamwich-tasting-report',
  '/weekly',
  '/weekly/2026-08-08',
]) {
  test(`${path} renders without horizontal overflow on mobile`, async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(path);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

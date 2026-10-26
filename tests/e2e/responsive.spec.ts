import { expect, test } from '@playwright/test';
import { DOC_ROUTES } from './helpers/docViewer';

const MOBILE = { width: 375, height: 812 };
const DOC_MOBILE = { width: 390, height: 812 };

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

for (const path of [
  '/atisha',
  '/method',
  '/colophon',
  '/artifacts',
  '/weekly',
]) {
  test(`${path} renders without horizontal overflow on mobile`, async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(path);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

// All 11 doc routes at 390px (per ticket #46)
for (const route of DOC_ROUTES) {
  test(`${route} renders without horizontal overflow at 390px`, async ({ page }) => {
    await page.setViewportSize(DOC_MOBILE);
    await page.goto(route);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

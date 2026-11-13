// ABOUTME: E2E: no horizontal overflow on every page route at phone widths, and on all 11 doc routes at 390px.
import { expect, test } from '@playwright/test';
import { DOC_ROUTES } from './helpers/docViewer';

const ROUTES = ['/', '/atisha', '/building', '/method', '/colophon', '/backstage', '/backstage/weekly', '/no-such-page'];

async function hasHorizontalOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

for (const width of [320, 390]) {
  for (const path of ROUTES) {
    test(`${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
}

for (const route of DOC_ROUTES) {
  test(`${route} has no horizontal overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 812 });
    await page.goto(route);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

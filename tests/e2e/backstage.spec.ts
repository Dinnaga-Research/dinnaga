// ABOUTME: E2E for Behind the scenes (#64): /backstage, /backstage/weekly and a report, deep links,
// ABOUTME: the 404s, no link to it from the site, no overflow at 390px, and the doc viewer and raw files.
import { expect, test } from '@playwright/test';

test('/backstage shows the h1, the lede, the empty-list line and the weekly archive link', async ({ page }) => {
  await page.goto('/backstage');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Behind the scenes');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(
    page.getByText(
      "Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source.",
    ),
  ).toBeVisible();
  // All three Docs are published, so nothing is listed.
  await expect(page.getByText('No unpublished docs right now.')).toBeVisible();
  await expect(page.getByRole('main').getByRole('link')).toHaveCount(1);
  const weekly = page.getByRole('main').getByRole('link', { name: 'Weekly reports' });
  await expect(weekly).toHaveAttribute('href', '/backstage/weekly');
  await expect(page.getByText('8 reports, paused since 26 Sep 2026')).toBeVisible();
});

test('the Weekly reports link opens the archive, and a report opens from it', async ({ page }) => {
  await page.goto('/backstage');
  await page.getByRole('link', { name: 'Weekly reports' }).click();
  await expect(page).toHaveURL('/backstage/weekly');
  await page.getByRole('link', { name: 'Week in review, 3–8 Aug 2026' }).click();
  await expect(page).toHaveURL('/backstage/weekly/2026-08-08');
  await page.getByRole('navigation', { name: 'Doc' }).getByRole('link', { name: '← Weekly reports' }).click();
  await expect(page).toHaveURL('/backstage/weekly');
});

test('/backstage/weekly is the dated archive: h1, intro, paused line, eight rows newest first', async ({ page }) => {
  await page.goto('/backstage/weekly');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Weekly reports');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(
    page.getByText(
      'The lab ran a week-in-review pass over its own transcripts each Saturday. Each run links to its full report.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Paused since 26 Sep 2026.', { exact: true })).toBeVisible();
  const links = page.getByRole('main').getByRole('link');
  await expect(links).toHaveCount(8);
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs[0]).toBe('/backstage/weekly/2026-09-26');
  expect(hrefs.at(-1)).toBe('/backstage/weekly/2026-08-08');
  expect([...hrefs].sort().reverse()).toEqual(hrefs);
  await expect(links.first()).toHaveText('Week in review, 21–26 Sep 2026');
  await expect(links.last()).toHaveText('Week in review, 3–8 Aug 2026');
  await expect(page.getByRole('main')).not.toContainText(' — ');
});

test('/backstage/weekly/2026-08-08 shows the report, the back link, one main and one h1', async ({ page }) => {
  await page.goto('/backstage/weekly/2026-08-08');
  await expect(page.getByRole('heading', { level: 1, name: /Your Week in Review/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  const bar = page.getByRole('navigation', { name: 'Doc' });
  await expect(bar.getByRole('link', { name: '← Weekly reports' })).toHaveAttribute('href', '/backstage/weekly');
  await expect(bar).toContainText('Weekly report');
  await expect(bar.getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
    'href',
    '/artifact-docs/weekly/2026-08-08.html',
  );
  await expect(page.getByRole('heading', { level: 2, name: 'About this doc' })).toBeVisible();
});

for (const path of ['/backstage/no-such-doc', '/backstage/weekly/2026-01-01', '/loadout']) {
  test(`${path} shows the 404 page and keeps its URL`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveURL(path);
  });
}

test('no link on the homepage points at /backstage or /artifacts: not the nav, the footer or the body', async ({
  page,
}) => {
  await page.goto('/');
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  expect(hrefs.length).toBeGreaterThan(5);
  expect(hrefs.filter((h) => h.startsWith('/backstage') || h.startsWith('/artifacts'))).toEqual([]);
});

test('Atisha and the 404 do not link Behind the scenes either', async ({ page }) => {
  for (const path of ['/atisha', '/no-such-page']) {
    await page.goto(path);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.filter((h) => h.startsWith('/backstage') || h.startsWith('/artifacts'))).toEqual([]);
  }
});

test.describe('at 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ['/backstage', '/backstage/weekly', '/backstage/weekly/2026-08-08']) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test('Tab from the skip link reaches the Weekly reports link and shows the paper focus ring', async ({ page }) => {
  await page.goto('/backstage');
  const link = page.getByRole('main').getByRole('link', { name: 'Weekly reports' });
  await link.focus();
  await expect(link).toBeFocused();
  const outline = await link.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  expect(outline.style).toBe('solid');
  expect(outline.width).toBe('2px');
});

// Coverage moved from the deleted artifacts and weekly specs.
test('the doc viewer mounts a report and a Doc in shadow DOM', async ({ page }) => {
  await page.goto('/backstage/weekly/2026-08-08');
  await expect(page.getByRole('heading', { name: /Your Week in Review/ })).toBeVisible();
  await expect(page.locator('[data-doc-host]')).toHaveJSProperty('shadowRoot.mode', 'open');
  await page.goto('/atisha/slamwich-tasting-report');
  await expect(page.getByRole('heading', { level: 1, name: /What 84 rebuilds of 28 acclaimed portfolios/i })).toBeVisible();
  await expect(page.locator('[data-doc-host]')).toHaveJSProperty('shadowRoot.mode', 'open');
});

test('the raw doc and report files are served as static files', async ({ request }) => {
  const doc = await request.get('/artifact-docs/slamwich-tasting-report.html');
  expect(doc.ok()).toBe(true);
  const docText = await doc.text();
  expect(docText).toContain('<!doctype html>');
  expect(docText).toContain('SLAMWICH Tasting Report');
  const report = await request.get('/artifact-docs/weekly/2026-08-08.html');
  expect(report.ok()).toBe(true);
  const reportText = await report.text();
  expect(reportText).toContain('<!doctype html>');
  expect(reportText).toContain('Week in Review');
});

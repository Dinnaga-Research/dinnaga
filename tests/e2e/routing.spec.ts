// ABOUTME: E2E for the route table: every page deep-links on a hard load (SPA fallback), unknown
// ABOUTME: paths and unpublished or unknown slugs show the 404 and keep their URL, old URLs redirect.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fullFixture: unknown = JSON.parse(readFileSync('tests/fixtures/living/full.json', 'utf8'));

const PAGES: { path: string; heading: string | RegExp }[] = [
  { path: '/', heading: 'Living documents for engineers who code with AI' },
  { path: '/atisha', heading: 'Atisha' },
  { path: '/building', heading: "What we're building" },
  { path: '/method', heading: 'How we test' },
  { path: '/colophon', heading: 'Colophon' },
  { path: '/backstage', heading: 'Behind the scenes' },
  { path: '/backstage/weekly', heading: 'Weekly reports' },
  { path: '/atisha/slamwich-tasting-report', heading: /84 rebuilds/ },
  { path: '/backstage/weekly/2026-08-08', heading: /week/i },
];

for (const p of PAGES) {
  test(`deep link ${p.path} resolves on a hard load`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page).toHaveURL(p.path);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(p.heading);
    await expect(page.locator('main')).toHaveCount(1);
  });
}

for (const path of ['/loadout', '/no-such-page', '/atisha/no-such-doc', '/atisha/2026-08-08', '/backstage/weekly/2026-01-01']) {
  test(`${path} shows the 404 page and keeps its URL`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveURL(path);
  });
}

test('/atisha lists the published docs and opens one in the reader', async ({ page }) => {
  await page.goto('/atisha');
  await page.getByRole('main').getByRole('link', { name: 'SLAMWICH tasting report' }).click();
  await expect(page).toHaveURL('/atisha/slamwich-tasting-report');
  const bar = page.getByRole('navigation', { name: 'Doc' });
  await expect(bar.getByRole('link', { name: '← Atisha' })).toHaveAttribute('href', '/atisha');
  await expect(bar).toContainText('Report');
  await expect(page.locator('.doc-colophon .tested-line')).toContainText('84 rebuilds of the 28 sites');
});

test('a published /backstage/:slug and the old URLs replace themselves with their new home', async ({ page }) => {
  await page.goto('/backstage/slamwich-tasting-report');
  await expect(page).toHaveURL('/atisha/slamwich-tasting-report');
  await page.goto('/artifacts/llm-best-practices-copilot-studio#c07');
  await expect(page).toHaveURL('/atisha/llm-best-practices-copilot-studio#c07');
  await page.goto('/weekly/2026-08-08?x=1');
  await expect(page).toHaveURL('/backstage/weekly/2026-08-08?x=1');
  await page.goto('/artifacts');
  await expect(page).toHaveURL('/backstage');
});

test('the dev API answers /api/living with contract JSON, not the SPA shell', async ({ request }) => {
  const res = await request.get('/api/living');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/json');
  const body = await res.json();
  expect(Object.keys(body).sort()).toEqual(['generatedAt', 'gists', 'posts', 'repos']);
});

test('the e2e server answers /api/living from the fixture, never the live APIs', async ({ request }) => {
  // playwright.config.ts starts Vite with API_FIXTURES, so no spec reaches GitHub or the Substack.
  // A reused dev server started without it fails here instead of rate-limiting the suite.
  const res = await request.get('/api/living');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual(fullFixture);
});

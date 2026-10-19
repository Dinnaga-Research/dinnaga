import { expect, test } from '@playwright/test';

const ROUTES = [
  { path: '/atisha', heading: 'Atisha' },
  { path: '/method', heading: /From read to ship/i },
  { path: '/colophon', heading: /Colophon/i },
];

for (const r of ROUTES) {
  test(`deep link ${r.path} resolves on hard load (SPA fallback)`, async ({ page }) => {
    await page.goto(r.path);
    await expect(page).toHaveURL(new RegExp(r.path.replace('/', '\\/') + '$'));
    await expect(page.getByRole('heading', { name: r.heading }).first()).toBeVisible();
  });
}

test('loading /loadout shows the 404 page', async ({ page }) => {
  await page.goto('/loadout');
  await expect(page).toHaveURL('/loadout');
  await expect(page.getByRole('heading', { name: /No transmission here/i })).toBeVisible();
});

test('an unknown deep link renders the 404 page', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { name: /No transmission here/i })).toBeVisible();
});

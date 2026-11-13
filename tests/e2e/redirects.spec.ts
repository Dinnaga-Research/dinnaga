// ABOUTME: E2E for #64's old-URL rules: each /artifacts and /weekly URL lands on its new home on a hard
// ABOUTME: load with the query and hash kept, leaves no history entry, and the Copilot sheets' own links work.
import { expect, test } from '@playwright/test';

const OLD_TO_NEW: [string, string][] = [
  ['/artifacts', '/backstage'],
  ['/artifacts/slamwich-tasting-report', '/atisha/slamwich-tasting-report'],
  ['/artifacts/llm-best-practices-copilot-studio#c07', '/atisha/llm-best-practices-copilot-studio#c07'],
  ['/weekly', '/backstage/weekly'],
  ['/weekly/2026-08-08?x=1', '/backstage/weekly/2026-08-08?x=1'],
];

for (const [from, to] of OLD_TO_NEW) {
  test(`a hard load of ${from} lands on ${to}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(from);
    await expect(page).toHaveURL(to);
    await expect(page.locator('main')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test(`Back after ${from} redirects does not return to it`, async ({ page }) => {
    await page.goto('/');
    await page.goto(from);
    await expect(page).toHaveURL(to);
    await page.goBack();
    await expect(page).toHaveURL('/');
  });
}

test('/backstage/<published slug> replaces itself with /atisha/<slug>, keeping the query and hash', async ({ page }) => {
  await page.goto('/');
  await page.goto('/backstage/slamwich-tasting-report?x=1#c07');
  await expect(page).toHaveURL('/atisha/slamwich-tasting-report?x=1#c07');
  await page.goBack();
  await expect(page).toHaveURL('/');
});

test('/artifacts/<unknown slug> ends on the 404 at /backstage/<slug>', async ({ page }) => {
  await page.goto('/artifacts/no-such-doc');
  await expect(page).toHaveURL('/backstage/no-such-doc');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
});

test('/artifacts/ with a trailing slash lands on /backstage', async ({ page }) => {
  await page.goto('/artifacts/');
  await expect(page).toHaveURL('/backstage');
  await expect(page.getByRole('heading', { level: 1, name: 'Behind the scenes' })).toBeVisible();
});

test('the Copilot Studio sheet\'s link to its sibling sheet (an old /artifacts URL, made absolute by the viewer) reaches the new page', async ({
  page,
}) => {
  await page.goto('/atisha/llm-best-practices-copilot-studio');
  const sibling = page.locator('a[href$="/artifacts/llm-best-practices-github-copilot"]').first();
  await expect(sibling).toBeVisible();
  await sibling.click();
  await expect(page).toHaveURL('/atisha/llm-best-practices-github-copilot');
  await expect(page.getByRole('navigation', { name: 'Doc' }).getByRole('link', { name: '← Atisha' })).toBeVisible();
});

test('the sheet\'s "all artifacts" link reaches /backstage', async ({ page }) => {
  await page.goto('/atisha/llm-best-practices-github-copilot');
  await page.locator('a[href$="/artifacts"]').first().click();
  await expect(page).toHaveURL('/backstage');
  await expect(page.getByRole('heading', { level: 1, name: 'Behind the scenes' })).toBeVisible();
});

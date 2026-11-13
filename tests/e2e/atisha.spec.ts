// ABOUTME: E2E for Atisha (#63): /atisha's copy and register order at 1440 and 390 with no overflow, the
// ABOUTME: first title opening its Doc in the reader, the 404 for unknown slugs, and keyboard focus on the register.
import { expect, test, type Page } from '@playwright/test';

const TITLES = [
  'Applying LLM best practices in GitHub Copilot',
  'Applying LLM best practices in Microsoft Copilot Studio',
  'SLAMWICH tasting report',
];
const KINDS = ['Cheat sheet', 'Cheat sheet', 'Report'];
const TESTED = [
  'Every control name checked against GitHub Docs on 9 Sep 2026.',
  'Every control name checked against Microsoft Learn on 9 Sep 2026.',
  '84 rebuilds of the 28 sites with the same content, compared trait by trait.',
];

const register = (page: Page) => page.getByRole('main').getByRole('list');
const rows = (page: Page) => register(page).getByRole('listitem');

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

for (const vp of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`at ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: vp });

    test('/atisha shows the copy and the three register rows in order, with no horizontal overflow', async ({
      page,
    }) => {
      await page.goto('/atisha');
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Atisha');
      await expect(
        main.getByText('The public library. Every document here was tested before it was published, and says how.'),
      ).toBeVisible();
      await expect(
        main.getByText(
          "We only publish what we've used ourselves. When a document relies on someone else's tool, it names the tool and links to it.",
        ),
      ).toBeVisible();
      await expect(
        main.getByText('Cheat sheets and reports today. Whitepapers and living documents are planned.'),
      ).toBeVisible();
      await expect(main.getByRole('link', { name: 'Atisha board' })).toHaveAttribute(
        'href',
        'https://github.com/orgs/Dinnaga-Research/projects/1',
      );

      await expect(rows(page)).toHaveCount(3);
      await expect(rows(page).getByRole('heading', { level: 2 })).toHaveText(TITLES);
      for (let i = 0; i < 3; i++) {
        const row = rows(page).nth(i);
        await expect(row.locator('.library-register__kind')).toHaveText(KINDS[i]!);
        await expect(row.locator('.tested-line')).toHaveText(TESTED[i]!);
        await expect(row.locator('.tested-line .tested-mark')).toBeVisible();
      }
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });

    test('every tested line sits fully inside the viewport width', async ({ page }) => {
      await page.goto('/atisha');
      const lines = rows(page).locator('.tested-line');
      await expect(lines).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        const box = (await lines.nth(i).boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
      }
    });

    test('the first title opens its Doc in the reader: one h1, one main, ← Atisha back to /atisha', async ({
      page,
    }) => {
      await page.goto('/atisha');
      await rows(page).first().getByRole('link', { name: TITLES[0] }).click();
      await expect(page).toHaveURL('/atisha/llm-best-practices-github-copilot');
      // The Doc's own h1, inside the viewer's shadow root (role locators pierce open shadow roots).
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      const bar = page.getByRole('navigation', { name: 'Doc' });
      await expect(bar.getByRole('link', { name: '← Atisha' })).toHaveAttribute('href', '/atisha');
      await expect(bar).toContainText('Cheat sheet');
      await expect(bar.getByRole('link', { name: 'Open standalone' })).toBeVisible();
      await expect(page.locator('.doc-colophon .tested-line')).toHaveText(TESTED[0]!);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  });
}

for (const path of ['/atisha/2026-08-08', '/atisha/no-such-doc']) {
  test(`${path} shows the 404 page and keeps its URL`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('navigation', { name: 'Doc' })).toHaveCount(0);
  });
}

test('Tab from the skip link reaches the first register link, which shows the paper focus ring', async ({
  page,
  browserName,
}) => {
  // macOS WebKit only tabs to links with Option held (Safari's default).
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.goto('/atisha');
  await page.keyboard.press(tab);
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press(tab);
  const first = rows(page).first().getByRole('link', { name: TITLES[0] });
  await expect(first).toBeFocused();
  const ring = await first.evaluate((a) => {
    const cs = getComputedStyle(a);
    return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`;
  });
  expect(ring).toBe('solid 2px rgb(236, 228, 211)');
  // The title link shows its underline while focused (§7.3).
  expect(await first.evaluate((a) => getComputedStyle(a).textDecorationLine)).toBe('underline');
});

test('/atisha never links to Behind the scenes', async ({ page }) => {
  await page.goto('/atisha');
  const hrefs = await page.getByRole('main').getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h?.startsWith('/backstage') || h?.startsWith('/artifacts'))).toEqual([]);
});

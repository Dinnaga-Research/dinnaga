// ABOUTME: E2E for How we test (/method) and the Colophon (#71): one h1 each, no overflow at 390, Noto Sans loaded
// ABOUTME: for the IAST letters, and /method's five stills: labelled, painted only when scrolled near, same under reduced motion.
import { expect, test, type Page } from '@playwright/test';

const STAGES = ['Read', 'Digest', 'Ideate', 'Experiment', 'Ship'];

// Neither page reads /api/living; fulfil it anyway so no test can reach the live API.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/living', (route) =>
    route.fulfill({ path: 'tests/fixtures/living/empty.json' }),
  );
});

const overflows = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );

/** A canvas is painted when it has a real size and at least one pixel that isn't transparent. */
function painted(page: Page, i: number) {
  return page.evaluate((i) => {
    const c = document.querySelectorAll<HTMLCanvasElement>('.method-stage canvas')[i]!;
    if (c.width < 2 || c.height < 2) return false;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    for (let k = 3; k < d.length; k += 4) if (d[k]! > 0) return true;
    return false;
  }, i);
}

/** A cheap fingerprint of a painted still: its size and a sum over a sparse pixel grid. */
function fingerprint(page: Page, i: number) {
  return page.evaluate((i) => {
    const c = document.querySelectorAll<HTMLCanvasElement>('.method-stage canvas')[i]!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let k = 0; k < d.length; k += 4 * 97)
      sum = (sum + d[k]! * 3 + d[k + 1]! * 5 + d[k + 2]! * 7) % 1_000_003;
    return `${c.width}x${c.height}:${sum}`;
  }, i);
}

async function paintAll(page: Page) {
  const prints: string[] = [];
  for (const [i, name] of STAGES.entries()) {
    await page
      .getByRole('img', { name: `Still frame for stage ${i + 1}, ${name}` })
      .scrollIntoViewIfNeeded();
    await expect.poll(() => painted(page, i)).toBe(true);
    prints.push(await fingerprint(page, i));
  }
  return prints;
}

for (const path of ['/method', '/colophon']) {
  test.describe(path, () => {
    test('has exactly one h1', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('has no horizontal overflow at 390×844', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      if (path === '/method') await paintAll(page);
      expect(await overflows(page)).toBe(false);
    });
  });
}

test('/colophon loads Noto Sans for the IAST letters', async ({ page }) => {
  await page.goto('/colophon');
  await expect(page.getByText(/pramāṇa/)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // #71 names 'ā', but no Noto face covers it, so that check is true on any page; 'ṇ' is what proves the load.
  await expect
    .poll(() =>
      page.evaluate(() => [
        document.fonts.check('16px "Noto Sans"', 'ā'),
        document.fonts.check('16px "Noto Sans"', 'ṇ'),
      ]),
    )
    .toEqual([true, true]);
});

test.describe('/method stills', () => {
  test('are five labelled images, one per stage, in order', async ({ page }) => {
    await page.goto('/method');
    const stills = page.locator('.method-stage canvas');
    await expect(stills).toHaveCount(5);
    for (const [i, name] of STAGES.entries()) {
      await expect(stills.nth(i)).toHaveAttribute('role', 'img');
      await expect(stills.nth(i)).toHaveAttribute(
        'aria-label',
        `Still frame for stage ${i + 1}, ${name}`,
      );
    }
    await expect(page.locator('.method-stage').last().locator('svg.stamp')).toHaveCount(1);
    await expect(page.locator('svg.stamp')).toHaveCount(1);
  });

  test('paint only once scrolled near', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/method');
    await expect.poll(() => painted(page, 0)).toBe(true);
    expect(await painted(page, 4)).toBe(false);
    await page.getByRole('img', { name: 'Still frame for stage 5, Ship' }).scrollIntoViewIfNeeded();
    await expect.poll(() => painted(page, 4)).toBe(true);
  });

  test('render the same under reduced motion', async ({ browser }) => {
    const shoot = async (reducedMotion: 'reduce' | 'no-preference') => {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion,
      });
      try {
        const page = await context.newPage();
        await page.route('**/api/living', (route) => route.abort());
        await page.goto('/method');
        await page.evaluate(() => document.fonts.ready);
        return await paintAll(page);
      } finally {
        await context.close();
      }
    };
    const still = await shoot('reduce');
    const moving = await shoot('no-preference');
    expect(new Set(still).size).toBe(5); // five different moments, each really painted
    expect(still).toEqual(moving);
  });
});

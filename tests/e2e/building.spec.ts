// ABOUTME: E2E for /building (#66) and the homepage's living sections (#69), with /api/living fulfilled
// ABOUTME: from tests/fixtures/living or aborted: column layout, failure lines, landmarks, focus, overflow.
import { expect, test, type Page } from '@playwright/test';

const FIXTURES = 'tests/fixtures/living';
const COLUMNS = ['Repositories', 'Writing', 'Gists'];

function living(page: Page, fixture: 'full' | 'failed' | 'empty' | 'abort') {
  return page.route('**/api/living', (route) =>
    fixture === 'abort' ? route.abort() : route.fulfill({ path: `${FIXTURES}/${fixture}.json` }),
  );
}

/** Collect uncaught page errors for the whole test. */
function pageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const overflows = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

async function columnHeadings(page: Page) {
  const boxes = [];
  for (const name of COLUMNS) {
    const box = await page.getByRole('heading', { level: 2, name, exact: true }).boundingBox();
    expect(box, name).not.toBeNull();
    boxes.push(box!);
  }
  return boxes;
}

test.describe('/building', () => {
  test('at 1440×900 the three column headings share one row, in order', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page, 'full');
    await page.goto('/building');
    await expect(page.getByRole('link', { name: 'living-graph' })).toBeVisible();
    const [repos, writing, gists] = await columnHeadings(page);
    expect(Math.abs(writing!.y - repos!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(gists!.y - repos!.y)).toBeLessThanOrEqual(1);
    expect(repos!.x).toBeLessThan(writing!.x);
    expect(writing!.x).toBeLessThan(gists!.x);
    expect(await overflows(page)).toBe(false);
  });

  test('at 390×844 they stack in order with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await living(page, 'full');
    await page.goto('/building');
    await expect(page.getByRole('link', { name: 'living-graph' })).toBeVisible();
    const [repos, writing, gists] = await columnHeadings(page);
    expect(repos!.y + repos!.height).toBeLessThan(writing!.y);
    expect(writing!.y + writing!.height).toBeLessThan(gists!.y);
    expect(Math.abs(writing!.x - repos!.x)).toBeLessThanOrEqual(1);
    expect(await overflows(page)).toBe(false);
  });

  for (const width of [390, 1440]) {
    test(`the failure fixture shows two failure lines and the posts at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await living(page, 'failed');
      await page.goto('/building');
      await expect(page.getByText("Couldn't load right now.")).toHaveCount(2);
      await expect(page.getByRole('link', { name: 'The coming storm' })).toBeVisible();
      expect(await overflows(page)).toBe(false);
    });
  }

  test('aborted: three failure lines and no uncaught page error', async ({ page }) => {
    const errors = pageErrors(page);
    await living(page, 'abort');
    await page.goto('/building');
    await expect(page.getByText("Couldn't load right now.")).toHaveCount(3);
    for (const name of ['weytani on GitHub →', 'All posts on the Substack →', 'All gists on GitHub →']) {
      await expect(page.getByRole('link', { name })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('exactly one h1 and one main; Tab from the skip link reaches the first repository link with a ring', async ({
    page,
    browserName,
  }) => {
    // macOS WebKit only tabs to links with Option held (Safari default)
    const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page, 'full');
    await page.goto('/building');
    await expect(page.getByRole('link', { name: 'dinnaga', exact: true })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);

    await page.keyboard.press(tab);
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    const first = page.getByRole('link', { name: 'dinnaga', exact: true });
    await expect(first).toBeFocused();
    const ring = await first.evaluate((a) => {
      const cs = getComputedStyle(a);
      return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor };
    });
    expect(ring).toEqual({ style: 'solid', width: '2px', color: 'rgb(236, 228, 211)' });
  });

  test('while /api/living is pending the columns are busy and show no text', async ({ page }) => {
    let release: () => void = () => {};
    const held = new Promise<void>((r) => (release = r));
    await page.route('**/api/living', async (route) => {
      await held;
      await route.fulfill({ path: `${FIXTURES}/full.json` });
    });
    await page.goto('/building');
    for (const name of COLUMNS) {
      const col = page.getByRole('region', { name });
      await expect(col).toHaveAttribute('aria-busy', 'true');
      await expect(col).toHaveText(name);
    }
    release();
    await expect(page.getByRole('region', { name: 'Repositories' })).not.toHaveAttribute('aria-busy', 'true');
  });
});

test.describe('homepage living sections', () => {
  const h2s = (page: Page) => page.getByRole('heading', { level: 2 }).allTextContents();

  test("with data, What we're building comes before Writing and /api/living is fetched once", async ({ page }) => {
    let requests = 0;
    page.on('request', (r) => {
      if (new URL(r.url()).pathname === '/api/living') requests++;
    });
    await living(page, 'full');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Writing' })).toBeVisible();
    const order = (await h2s(page)).filter((t) => t === "What we're building" || t === 'Writing');
    expect(order).toEqual(["What we're building", 'Writing']);
    await page.waitForLoadState('networkidle');
    expect(requests).toBe(1);
  });

  test('aborted: neither section renders and nothing throws', async ({ page }) => {
    const errors = pageErrors(page);
    await living(page, 'abort');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    const titles = await h2s(page);
    expect(titles).not.toContain("What we're building");
    expect(titles).not.toContain('Writing');
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1440]) {
    for (const fixture of ['full', 'failed'] as const) {
      test(`no horizontal overflow at ${width}px with the ${fixture} fixture`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await living(page, fixture);
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 2, name: 'Writing' })).toBeVisible();
        expect(await overflows(page)).toBe(false);
      });
    }
  }
});

// ABOUTME: E2E for the homepage (#67, #68, #69): the run first, then the library, the living sections and How we
// ABOUTME: test; /api/living always from tests/fixtures/living (never live); Tab order, the skip, motion and reduced motion.
import { expect, test, type Page } from '@playwright/test';

const FIXTURES = 'tests/fixtures/living';
const MARKS = [0.06, 0.22, 0.4, 0.585, 0.78];
const STAGES = ['Read', 'Digest', 'Ideate', 'Experiment', 'Ship'];
const LAUNCH = [
  'Applying LLM best practices in GitHub Copilot',
  'Applying LLM best practices in Microsoft Copilot Studio',
  'SLAMWICH tasting report',
];

/** Fulfil /api/living from a fixture (or abort it); returns a counter of requests to it. */
async function living(page: Page, fixture: 'full' | 'failed' | 'abort' = 'full') {
  const calls = { n: 0 };
  await page.route('**/api/living', (route) => {
    calls.n++;
    return fixture === 'abort' ? route.abort() : route.fulfill({ path: `${FIXTURES}/${fixture}.json` });
  });
  return calls;
}

function pageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const h2s = (page: Page) => page.getByRole('heading', { level: 2 }).allTextContents();

// Window scroll position for moment p of the run (the stage sticks under the nav).
const scrollFor = (page: Page, p: number) =>
  page.evaluate((p) => {
    const run = document.querySelector('.run')!;
    const stage = document.querySelector<HTMLElement>('.stage')!;
    const r = run.getBoundingClientRect();
    const stick = parseFloat(getComputedStyle(stage).top) || 0;
    return r.top + scrollY - stick + p * (r.height - stage.clientHeight);
  }, p);

const scrollToP = async (page: Page, p: number) =>
  page.evaluate((y) => window.scrollTo(0, y), await scrollFor(page, p));

/** Elements in main that reach past the viewport's right edge (the footer is the site chrome's own check). */
const mainOverflow = (page: Page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll('main *')) {
      if (el.closest('.contact, .stage')) continue; // the phone strip scrolls by design; the stage clips
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1) out.push(`${el.tagName.toLowerCase()}.${el.className} ${Math.round(r.right)}`);
    }
    return { out, page: document.documentElement.scrollWidth > vw + 1 };
  });

test.describe('the homepage', () => {
  test('has exactly one h1, the headline, and one main', async ({ page }) => {
    await living(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Living documents for engineers who code with AI');
    await expect(page.locator('main')).toHaveCount(1);
  });

  test('with /api/living fulfilled the h2s read in order, and the API is asked once', async ({ page }) => {
    const calls = await living(page, 'full');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Writing' })).toBeVisible();
    expect(await h2s(page)).toEqual(['The library', "What we're building", 'Writing', 'How we test']);
    await page.waitForTimeout(500);
    expect(calls.n).toBe(1);
  });

  test('with /api/living aborted only the library and How we test remain, with no page error', async ({ page }) => {
    const errors = pageErrors(page);
    await living(page, 'abort');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'How we test' })).toBeAttached();
    await page.waitForTimeout(500);
    expect(await h2s(page)).toEqual(['The library', 'How we test']);
    await expect(page.getByRole('link', { name: 'Browse the library →' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`the library lists the launch Docs in order, each tested line inside the viewport at ${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await living(page);
      await page.goto('/');
      const library = page.locator('section', { has: page.getByRole('heading', { level: 2, name: 'The library' }) });
      const rows = library.getByRole('listitem');
      await expect(rows.getByRole('heading', { level: 3 })).toHaveText(LAUNCH);
      for (const row of await rows.all()) {
        const line = row.locator('.tested-line');
        await line.scrollIntoViewIfNeeded();
        const box = (await line.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(w);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(h);
      }
    });
  }

  test('the SLAMWICH title opens its doc in Atisha', async ({ page }) => {
    await living(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'SLAMWICH tasting report' }).click();
    await expect(page).toHaveURL(/\/atisha\/slamwich-tasting-report$/);
  });

  for (const w of [320, 390, 760, 1024, 1440, 1920]) {
    test(`no horizontal overflow at ${w}px, with full and failed data`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await living(page, 'full');
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 2, name: 'Writing' })).toBeAttached();
      expect((await mainOverflow(page)).out).toEqual([]);
      await page.unrouteAll();
      await living(page, 'failed');
      await page.reload();
      await expect(page.getByRole('heading', { level: 2, name: 'Writing' })).toBeAttached();
      expect((await mainOverflow(page)).out).toEqual([]);
    });
  }

  test('Tab order: skip link, brand, nav, David Ryan, the library link, Skip the sequence, then the rail', async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Jump to a method stage' })).toBeAttached();
    const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    const seen: string[] = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press(tab);
      seen.push(await page.evaluate(() => (document.activeElement as HTMLElement).innerText.replace(/\s+/g, ' ').trim()));
    }
    expect(seen).toEqual([
      'Skip to content',
      'DINNAGA RESEARCH',
      'Atisha',
      'Building',
      'How we test',
      expect.stringMatching(/^Writing/),
      'David Ryan',
      'Browse the library →',
      'Skip the sequence',
      '01 READ',
      '02 DIGEST',
      '03 IDEATE',
      '04 EXPERIMENT',
      '05 SHIP',
    ]);
  });

  test('a focused hero link is fully visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse the library →' }).focus();
    const hero = page.locator('.run__hero');
    await expect(hero).toHaveCSS('opacity', '1');
    const box = (await page.getByRole('link', { name: 'Browse the library →' }).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(900);
  });

  test('Skip the sequence moves focus past the run to #after-sequence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Skip the sequence' }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('after-sequence');
    const runBottom = await page.evaluate(() => document.querySelector('.run')!.getBoundingClientRect().bottom);
    expect(runBottom).toBeLessThanOrEqual(56 + 1);
    await expect(page.getByRole('heading', { level: 2, name: 'The library' })).toBeInViewport();
  });

  test('from 760 px the skip link shows while the run plays, and takes a pointer to the library', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Skip the sequence' });
    await expect(skip).toHaveCSS('opacity', '0');
    await scrollToP(page, 0.3);
    await expect(skip).toHaveCSS('opacity', '1');
    await expect(skip).toBeInViewport();
    await skip.click();
    await expect(page.getByRole('heading', { level: 2, name: 'The library' })).toBeInViewport();
  });

  test('scrolling through the run counts frames 001 to 180, makes each stage current in turn, and stamps after Ship', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.goto('/');
    const counter = page.locator('.run__counter');
    const stamp = page.locator('.run__overlay .stamp');
    const rail = page.getByRole('navigation', { name: 'Jump to a method stage' });
    await expect(counter).toHaveText('Frame 001 / 180');
    for (const [i, m] of MARKS.entries()) {
      await scrollToP(page, m + 0.01);
      await expect(rail.getByRole('button', { name: STAGES[i] })).toHaveAttribute('aria-current', 'step');
      await expect(rail.locator('[aria-current]')).toHaveCount(1);
      expect(Number(await stamp.evaluate((e) => getComputedStyle(e).opacity))).toBe(0);
    }
    await scrollToP(page, 1);
    await expect(counter).toHaveText('Frame 180 / 180');
    await expect.poll(() => stamp.evaluate((e) => Number(getComputedStyle(e).opacity))).toBe(1);
  });
});

test.describe('the homepage with reduced motion', () => {
  test('no plate, five stills, and the library within two viewports of the top at 1440', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.goto('/');
    await expect(page.locator('canvas.plate')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Five stills of the method sequence' }).getByRole('img')).toHaveCount(5);
    await expect(page.getByRole('navigation', { name: 'Jump to a method stage' })).toHaveCount(0);
    const top = await page
      .getByRole('heading', { level: 2, name: 'The library' })
      .evaluate((h) => h.getBoundingClientRect().top + scrollY);
    expect(top).toBeLessThan(2 * 900);
  });
});

test.describe('the homepage cold load', () => {
  test('fonts at most 100 KB and no image downloads', async ({ page, browserName }) => {
    await living(page);
    const images: string[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() === 'image' || /image\//.test(r.headers()['content-type'] ?? '')) images.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const fonts = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((e) => /\.woff2$/.test(e.name))
        .map((e) => ({ name: e.name, size: (e as PerformanceResourceTiming).decodedBodySize })),
    );
    // WebKit fetches a preloaded same-origin font twice (no-cors); count each file once (see visual-lint).
    const once = new Map(fonts.map((f) => [f.name, f.size]));
    const bytes = [...(browserName === 'webkit' ? once.values() : fonts.map((f) => f.size))].reduce((a, b) => a + b, 0);
    expect(bytes).toBeLessThanOrEqual(100_000);
    expect(images.filter((u) => !u.startsWith('blob:') && !/favicon|apple-touch-icon/.test(u))).toEqual([]);
  });

  test('the LCP element is the h1 and layout shift stays under 0.02 at 1440 (Chromium)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'LCP and layout-shift entries are Chromium-only');
    await page.setViewportSize({ width: 1440, height: 900 });
    await living(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: Element | null; __cls: number };
      w.__lcp = null;
      w.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) w.__lcp = (e as unknown as { element: Element | null }).element;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
          if (!e.hadRecentInput) w.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const { tag, cls } = await page.evaluate(() => {
      const w = window as unknown as { __lcp: Element | null; __cls: number };
      return { tag: w.__lcp?.closest('h1') ? 'h1' : (w.__lcp?.tagName ?? null), cls: w.__cls };
    });
    expect(tag).toBe('h1');
    expect(cls).toBeLessThan(0.02);
  });
});

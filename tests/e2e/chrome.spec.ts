// ABOUTME: E2E for the site chrome (#70): nav order and targets, per-route titles, descriptions and
// ABOUTME: robots, phone nav, the reader bar under the nav, sticky nav, the 404, footer, skip link, fonts, root size.
import { expect, test, type Page } from '@playwright/test';

const LEDE =
  'Dinnaga Research reads the papers, podcasts and vendor docs, tests what they claim, and publishes what holds up.';

// One sample per row of #70's table.
const META: { path: string; title: string; description: string; noindex: boolean }[] = [
  { path: '/', title: 'Dinnaga Research', description: LEDE, noindex: false },
  {
    path: '/atisha',
    title: 'Atisha · Dinnaga Research',
    description: 'The public library. Every document here was tested before it was published, and says how.',
    noindex: false,
  },
  {
    path: '/atisha/slamwich-tasting-report',
    title: 'SLAMWICH tasting report · Atisha · Dinnaga Research',
    description: 'What 28 acclaimed portfolio sites have in common, and which techniques do the most work.',
    noindex: false,
  },
  {
    path: '/building',
    title: "What we're building · Dinnaga Research",
    description: 'Recent repositories, Substack posts and public gists from Dinnaga Research.',
    noindex: false,
  },
  {
    path: '/method',
    title: 'How we test · Dinnaga Research',
    description: 'We build every idea before we write about it, and most die in the trying.',
    noindex: false,
  },
  {
    path: '/colophon',
    title: 'Colophon · Dinnaga Research',
    description: 'How this site is built, set and hosted.',
    noindex: false,
  },
  {
    path: '/backstage',
    title: 'Behind the scenes · Dinnaga Research',
    description:
      "Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source.",
    noindex: true,
  },
  {
    path: '/backstage/weekly',
    title: 'Weekly reports · Behind the scenes · Dinnaga Research',
    description: 'The paused weekly archive.',
    noindex: true,
  },
  {
    path: '/backstage/weekly/2026-08-08',
    title: 'Weekly report, 3–8 Aug 2026 · Dinnaga Research',
    description: 'The paused weekly archive.',
    noindex: true,
  },
  {
    path: '/no-such-page',
    title: 'Page not found · Dinnaga Research',
    description: "There's nothing at this address.",
    noindex: true,
  },
];

const primary = (page: Page) => page.getByRole('navigation', { name: 'Primary' });

test('the nav lists Atisha, Building, How we test and Writing, in order, with their targets', async ({ page }) => {
  await page.goto('/');
  const links = primary(page).getByRole('link');
  await expect(links).toHaveCount(5);
  await expect(links.first()).toHaveAccessibleName('Dinnaga Research');
  await expect(links.first()).toHaveAttribute('href', '/');
  const rest = await links.evaluateAll((as) => as.slice(1).map((a) => a.getAttribute('href')));
  expect(rest).toEqual(['/atisha', '/building', '/method', 'https://weytani.substack.com/']);
  await expect(primary(page).getByRole('link', { name: 'Writing', exact: true })).toBeVisible();
  for (const name of ['Atisha', 'Building', 'How we test']) {
    await expect(primary(page).getByRole('link', { name, exact: true })).toBeVisible();
  }
});

for (const row of META) {
  test(`metadata on a hard load of ${row.path}`, async ({ page }) => {
    await page.goto(row.path);
    await expect(page).toHaveTitle(row.title);
    await expect(page.locator('title')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', row.description);
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(row.noindex ? 1 : 0);
  });
}

test('a client navigation from /backstage to /atisha removes the robots meta', async ({ page }) => {
  await page.goto('/backstage');
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  await page.evaluate(() => {
    (window as unknown as { __spa: number }).__spa = 1;
  });
  await primary(page).getByRole('link', { name: 'Atisha', exact: true }).click();
  await expect(page).toHaveURL(/\/atisha$/);
  await expect(page).toHaveTitle('Atisha · Dinnaga Research');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __spa?: number }).__spa)).toBe(1);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 640 },
]) {
  test.describe(`phone nav at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('all four links are visible, in the viewport and at least 44px tall; nothing hidden; no overflow', async ({
      page,
    }) => {
      await page.goto('/');
      for (const name of ['Atisha', 'Building', 'How we test', 'Writing']) {
        const link = primary(page).getByRole('link', { name, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toBeInViewport({ ratio: 1 });
        const box = (await link.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      const hidden = await primary(page).evaluate((nav) =>
        [nav, ...nav.querySelectorAll('*')].filter((el) => getComputedStyle(el).display === 'none').length,
      );
      expect(hidden).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      ).toBe(false);
    });
  });
}

test.describe('the reader bar on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('after scrolling 2000px the bar is at the top and the nav does not overlap it', async ({ page }) => {
    await page.goto('/atisha/llm-best-practices-copilot-studio');
    await expect(page.locator('[data-doc-host]')).toHaveAttribute('aria-busy', 'false');
    await page.evaluate(() => window.scrollTo(0, 2000));
    const bar = page.getByRole('navigation', { name: 'Doc' });
    await expect.poll(() => bar.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
    const [nav, barBox] = await Promise.all([
      primary(page).evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect),
      bar.evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect),
    ]);
    expect(nav.bottom <= barBox.top || nav.top >= barBox.bottom).toBe(true);
  });
});

test.describe('desktop nav', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('is sticky, and How we test is current on /method', async ({ page }) => {
    await page.goto('/method');
    await expect(primary(page).getByRole('link', { name: 'How we test', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(primary(page).getByRole('link', { name: 'Atisha', exact: true })).not.toHaveAttribute(
      'aria-current',
    );
    expect(await primary(page).evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(primary(page)).toBeInViewport();
    expect(await primary(page).evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
  });
});

for (const path of ['/loadout', '/no-such-page']) {
  test(`${path} shows the 404 page with links to / and /atisha`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'homepage' })).toHaveAttribute('href', '/');
    await expect(main.getByRole('link', { name: 'Atisha' })).toHaveAttribute('href', '/atisha');
  });
}

test('the footer has exactly the six links and none to /backstage', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  const links = await footer.getByRole('link').evaluateAll((as) => as.map((a) => [a.textContent, a.getAttribute('href')]));
  expect(links).toEqual([
    ['Atisha', '/atisha'],
    ['Building', '/building'],
    ['How we test', '/method'],
    ['Colophon', '/colophon'],
    ['Source on GitHub', 'https://github.com/Dinnaga-Research/dinnaga'],
    ['Substack', 'https://weytani.substack.com/'],
  ]);
  await expect(footer).toContainText('Dinnaga Research is run by David Ryan.');
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Dinnaga Research`);
});

test('the skip link is the first focusable element and every nav and footer link shows the focus ring', async ({
  page,
  browserName,
}) => {
  // macOS WebKit only tabs to links with Option held (Safari default)
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.goto('/colophon');
  await page.keyboard.press(tab);
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeInViewport();
  await page.keyboard.press(tab);
  await expect(primary(page).getByRole('link', { name: 'Dinnaga Research' })).toBeFocused();

  const CHROME = 'nav[aria-label="Primary"] a, footer#footer a';
  const total = await page.locator(CHROME).count();
  const rings: { index: number; href: string | null; outline: string }[] = [];
  for (let i = 0; i < 60 && rings.length < total; i++) {
    const r = await page.evaluate((sel) => {
      const a = document.activeElement as HTMLElement | null;
      const index = a ? Array.from(document.querySelectorAll(sel)).indexOf(a) : -1;
      if (!a || index < 0) return null;
      const cs = getComputedStyle(a);
      return { index, href: a.getAttribute('href'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
    }, CHROME);
    if (r && !rings.some((x) => x.index === r.index)) rings.push(r);
    await page.keyboard.press(tab);
  }
  expect(rings).toHaveLength(total);
  for (const r of rings) expect(r.outline, r.href ?? '').toBe('solid 2px rgb(236, 228, 211)');
});

test.describe('fonts and the root size', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Archivo is loaded at 600 and 800; a label computes 62% and an h1 125%', async ({ page }) => {
    await page.goto('/no-such-page');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('600 13px Archivo'))).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('800 64px Archivo'))).toBe(true);
    expect(await page.locator('.dn-label').first().evaluate((el) => getComputedStyle(el).fontStretch)).toBe('62%');
    expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).fontStretch)).toBe('125%');
    expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Archivo"?,/);
  });

  for (const [width, px] of [
    [1440, 16],
    [1024, 15],
    [390, 15],
    [2560, 22],
  ] as const) {
    test(`the root font size is ${px}px at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const size = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      expect(size).toBeCloseTo(px, 1);
    });
  }
});

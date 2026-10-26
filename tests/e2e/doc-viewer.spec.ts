// ABOUTME: E2E tests for shadow-DOM doc viewer — all 11 routes at multiple viewports.
// ABOUTME: Covers: mounting, colors, overflow, forced-dark, missing doc, focus/motion.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { DOC_ROUTES, hostLocator, noHorizontalOverflow } from './helpers/docViewer';

// Expected forced-dark colors (ticket #46)
// Updated by #52/#53: every family's ground is --doc-bg's resolved value on screen
const FORCED_DARK_COLORS: Record<string, string> = {
  'slamwich-tasting-report': 'rgb(10, 10, 10)',
  'llm-best-practices-copilot-studio': 'rgb(10, 10, 10)',
  '2026-08-08': 'rgb(10, 10, 10)',
};

// Test each of the 11 routes at desktop and mobile viewports
for (const route of DOC_ROUTES) {
  test(`${route} @ desktop (1280px): h1 visible, single main`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(route);

    // Check doc's h1 is visible, and is the only h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCount(1);

    // Exactly one main on page (site's main, not doc's)
    await expect(page.locator('main')).toHaveCount(1);

    // No console errors
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);

    // No horizontal overflow
    await noHorizontalOverflow(page);
  });

  test(`${route} @ mobile (390px): h1 visible, single main`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 812 });
    await page.goto(route);

    // Check doc's h1 is visible
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCount(1);

    // Exactly one main on page
    await expect(page.locator('main')).toHaveCount(1);

    // No horizontal overflow
    await noHorizontalOverflow(page);
  });
}

// Forced-dark color tests (sample routes)
test('slamwich @ light OS: forced-dark background', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/artifacts/slamwich-tasting-report');

  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe(FORCED_DARK_COLORS['slamwich-tasting-report']);
});

test('copilot-studio @ light OS: forced-dark background', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/artifacts/llm-best-practices-copilot-studio');

  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe(FORCED_DARK_COLORS['llm-best-practices-copilot-studio']);
});

test('weekly 2026-08-08 @ light OS: forced-dark background', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/weekly/2026-08-08');

  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');
  // The weekly sheets put their ground on `body` (-> doc-body), not on `html`, and doc-body
  // fills the host. Its colour is --doc-bg's rgb(10, 10, 10).
  const bgColor = await host.evaluate((el) => {
    const body = el.shadowRoot?.querySelector('doc-body');
    return body ? window.getComputedStyle(body).backgroundColor : null;
  });

  expect(bgColor).toBe(FORCED_DARK_COLORS['2026-08-08']);
});

test('copilot-studio @ print: light background', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/artifacts/llm-best-practices-copilot-studio');

  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe('rgb(255, 255, 255)');
});

test('copilot-studio: .principle border re-serialization canary', async ({ page }) => {
  await page.goto('/artifacts/llm-best-practices-copilot-studio');

  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');
  const borderWidth = await host.evaluate((el) => {
    const sr = el.shadowRoot;
    if (!sr) return null;
    const principle = sr.querySelector('.principle');
    if (!principle) return null;
    return window.getComputedStyle(principle).borderTopWidth;
  });

  expect(borderWidth).toBe('1px');
});

test('missing doc: shows error message and link', async ({ page }) => {
  // Vercel and the dev server answer a missing doc with the SPA shell, status 200.
  const shell = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
  await page.route('**/artifact-docs/slamwich-tasting-report.html', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: shell }),
  );

  await page.goto('/artifacts/slamwich-tasting-report');

  await expect(page.getByText("This doc didn't load.")).toBeVisible();

  // The error link sits in the host's place, after the bar's own "Open standalone" link.
  const links = page.getByRole('link', { name: 'Open standalone', exact: true });
  await expect(links).toHaveCount(2);
  const link = links.last();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/artifact-docs/slamwich-tasting-report.html');

  // No shadow content: there is no host at all, and no h1 from the shell
  await expect(page.locator('[data-doc-host]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);

  // Exactly one site nav (the app was not rendered inside itself)
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
});

test('reduced motion: no animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/artifacts/slamwich-tasting-report');

  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');
  const running = await host.evaluate((el) => {
    const sr = el.shadowRoot;
    if (!sr) return -1;
    const all = [el, ...sr.querySelectorAll('*')];
    return all.reduce((n, node) => n + node.getAnimations().length, 0);
  });

  expect(running).toBe(0);
});

for (const vp of [
  { name: '1280px', width: 1280, height: 800 },
  { name: '390px', width: 390, height: 812 },
]) {
  test(`focus-visible @ ${vp.name}: skip link, then back link, standalone link, doc's first link, each with an outline`, async ({
    page,
    browserName,
  }) => {
    // macOS WebKit only tabs to links with Option held (Safari default)
    const TAB = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/artifacts/slamwich-tasting-report');
    await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

    const stop = () =>
      page.evaluate(() => {
        let el: Element | null = document.activeElement;
        const inDoc = !!document.querySelector('[data-doc-host]')?.shadowRoot?.activeElement;
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          cls: el.getAttribute('class') ?? '',
          text: (el.textContent ?? '').trim(),
          inDoc,
          style: cs.outlineStyle,
          width: parseFloat(cs.outlineWidth),
        };
      });

    const stops: NonNullable<Awaited<ReturnType<typeof stop>>>[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(TAB);
      const o = await stop();
      expect(o, `tab stop ${i}`).not.toBeNull();
      expect(o!.style, `outline style at stop ${i} (${o!.tag})`).not.toBe('none');
      expect(o!.width, `outline width at stop ${i} (${o!.tag})`).toBeGreaterThan(0);
      stops.push(o!);
      if (o!.inDoc) break;
    }
    expect(stops[0]!.text).toBe('Skip to content');
    const back = stops.findIndex((o) => o.cls.includes('doc-bar-back'));
    expect(back, 'reached the back link').toBeGreaterThan(0);
    expect(stops[back]!.text).toBe('\u2190 Behind the scenes');
    expect(stops[back + 1]!.cls).toContain('doc-bar-open');
    expect(stops[back + 1]!.text).toBe('Open standalone');
    // Firefox makes a horizontally scrollable element a Tab stop. At 390px the host scrolls
    // wide code inside itself (page overflow stays 0), so the host may be a stop of its own.
    let docStop = back + 2;
    if (stops[docStop]!.cls.includes('doc-host')) {
      const scrolls = await hostLocator(page).evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(scrolls, 'the host is only a Tab stop when it scrolls').toBe(true);
      docStop += 1;
    }
    expect(stops[docStop]!.inDoc, "the stop after the standalone link is in the doc").toBe(true);
    expect(stops[docStop]!.tag).toBe('A');
    expect(stops).toHaveLength(docStop + 1);
  });
}

// Container query tests (UNIT-002)
// Note: Container queries are used internally for width adaptation.
// The following tests verify the behavior works as expected.

// cqi proof test (UNIT-002)
test('cqi: on /artifacts/llm-best-practices-copilot-studio at 1280px, h1 font-size reduces when host width set to 500px', async ({ page }) => {
  await page.goto('/artifacts/llm-best-practices-copilot-studio');
  const host = hostLocator(page);
  await expect(host).toHaveAttribute('aria-busy', 'false');

  // Get initial h1 font-size
  const initialSize = await host.evaluate((el) => {
    const sr = el.shadowRoot;
    if (!sr) return null;
    const h1 = sr.querySelector('h1');
    if (!h1) return null;
    const size = window.getComputedStyle(h1).fontSize;
    return parseFloat(size);
  });

  expect(initialSize).toBeGreaterThan(0);

  // Set host inline width to 500px
  await host.evaluate((el) => {
    (el as HTMLElement).style.width = '500px';
  });

  // Wait for any reflow
  await page.waitForTimeout(100);

  // Get new h1 font-size
  const reducedSize = await host.evaluate((el) => {
    const sr = el.shadowRoot;
    if (!sr) return null;
    const h1 = sr.querySelector('h1');
    if (!h1) return null;
    const size = window.getComputedStyle(h1).fontSize;
    return parseFloat(size);
  });

  expect(reducedSize).toBeLessThan(initialSize!);
});

// ---------------------------------------------------------------------------
// UNIT-002 (#47): container proof, font hoisting
// ---------------------------------------------------------------------------

/** Rounded `top` of the first two direct children of the first .grid2 in the doc. */
const grid2Tops = (page: Page) =>
  hostLocator(page).evaluate((el) => {
    const grid = el.shadowRoot?.querySelector('.grid2');
    if (!grid) return null;
    return [...grid.children].slice(0, 2).map((c) => Math.round(c.getBoundingClientRect().top));
  });

test('container proof: /weekly/2026-08-08 .grid2 is two columns at 1280, stacks at host width 500px', async ({
  page,
}) => {
  await page.goto('/weekly/2026-08-08');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

  const wide = await grid2Tops(page);
  expect(wide).toHaveLength(2);
  expect(wide![0]).toBe(wide![1]);

  await hostLocator(page).evaluate((el) => {
    (el as HTMLElement).style.width = '500px';
  });
  await expect.poll(async () => {
    const t = await grid2Tops(page);
    return t![0] !== t![1];
  }).toBe(true);
});

test('container proof: /weekly/2026-08-08 .grid2 stacks at a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 812 });
  await page.goto('/weekly/2026-08-08');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const tops = await grid2Tops(page);
  expect(tops).toHaveLength(2);
  expect(tops![0]).not.toBe(tops![1]);
});

test('@font-face is hoisted once to document.adoptedStyleSheets with an absolute src, and leaves the doc sheet', async ({
  page,
}) => {
  const real = readFileSync(join(process.cwd(), 'public/artifact-docs/slamwich-tasting-report.html'), 'utf-8');
  const html = real.replace(
    '</head>',
    '<style>@font-face{font-family:"DnHoistProbe";src:url(fonts/probe.woff2)}</style></head>',
  );
  await page.route('**/artifact-docs/slamwich-tasting-report.html', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  );
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

  const result = await hostLocator(page).evaluate((el) => {
    const faces = (sheet: CSSStyleSheet) =>
      [...sheet.cssRules].filter((r) => r instanceof CSSFontFaceRule && r.cssText.includes('DnHoistProbe'));
    const inDoc = (el.shadowRoot?.adoptedStyleSheets ?? []).flatMap((s) => faces(s));
    const inPage = document.adoptedStyleSheets.flatMap((s) => faces(s));
    return { inDoc: inDoc.length, inPage: inPage.map((r) => r.cssText) };
  });
  expect(result.inDoc).toBe(0);
  expect(result.inPage).toHaveLength(1);
  expect(result.inPage[0]).toContain('http://localhost:4242/artifact-docs/fonts/probe.woff2');
});

// ---------------------------------------------------------------------------
// UNIT-003 (#48): anchors and SPA links
// ---------------------------------------------------------------------------

const COPILOT_STUDIO = '/artifacts/llm-best-practices-copilot-studio';
const GITHUB_COPILOT = '/artifacts/llm-best-practices-github-copilot';

/** `--dn-nav-h` in px, measured through a probe element so it works at any breakpoint. */
const navHeight = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--dn-nav-h)';
    document.body.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    return h;
  });

const targetState = (page: Page, id: string) =>
  hostLocator(page).evaluate((el, targetId) => {
    const t = el.shadowRoot?.getElementById(targetId);
    return {
      top: t ? t.getBoundingClientRect().top : null,
      marked: t ? t.hasAttribute('data-doc-target') : false,
      focused: !!t && el.shadowRoot!.activeElement === t,
    };
  }, id);

/** Bottom edge of the sticky Doc bar, in viewport px. */
const barBottom = (page: Page) =>
  page.getByRole('navigation', { name: 'Doc' }).evaluate((el) => el.getBoundingClientRect().bottom);

async function expectInPlace(page: Page, id: string) {
  const nav = await barBottom(page);
  expect(nav).toBeGreaterThan(await navHeight(page));
  await expect
    .poll(async () => {
      const s = await targetState(page, id);
      return s.top !== null && s.top >= nav - 0.5 && s.top <= nav + 32 + 0.5;
    }, { message: `#${id} top edge between the bar's bottom edge (${nav}) and +32px` })
    .toBe(true);
  const s = await targetState(page, id);
  expect(s.marked).toBe(true);
  expect(s.focused).toBe(true);
}

for (const vp of [
  { name: '1280px', width: 1280, height: 800 },
  { name: '390px', width: 390, height: 812 },
]) {
  test.describe(`anchors @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('rail click on #c07 sets the hash, lands under the nav, marks and focuses the clause', async ({
      page,
    }) => {
      await page.goto(COPILOT_STUDIO);
      await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
      await hostLocator(page).locator('.rail a[href="#c07"]').click();
      await expect(page).toHaveURL(/#c07$/);
      await expectInPlace(page, 'c07');
    });

    test('#c03 then Back returns to #c07 and scrolls it back into place', async ({ page }) => {
      await page.goto(COPILOT_STUDIO);
      await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
      await hostLocator(page).locator('.rail a[href="#c07"]').click();
      await expect(page).toHaveURL(/#c07$/);
      await expectInPlace(page, 'c07');
      await hostLocator(page).locator('.rail a[href="#c03"]').click();
      await expect(page).toHaveURL(/#c03$/);
      await expectInPlace(page, 'c03');

      await page.goBack();
      await expect(page).toHaveURL(/#c07$/);
      await expectInPlace(page, 'c07');
      expect((await targetState(page, 'c03')).marked).toBe(false);
    });

    test('a hard load with #c07 lands with #c07 in place', async ({ page }) => {
      await page.goto(`${COPILOT_STUDIO}#c07`);
      await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
      await expectInPlace(page, 'c07');
    });
  });
}

test('SPA: the in-doc link to the GitHub Copilot sheet navigates without a reload', async ({ page }) => {
  await page.goto(COPILOT_STUDIO);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  await page.evaluate(() => {
    (window as unknown as { __spaMarker: number }).__spaMarker = 1;
  });
  const link = hostLocator(page).locator('a[href$="/artifacts/llm-best-practices-github-copilot"]').last();
  await link.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await link.click();

  await expect(page).toHaveURL(new RegExp(`${GITHUB_COPILOT}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('GitHub');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __spaMarker?: number }).__spaMarker)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('[data-doc-host]')).toHaveCount(1);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${COPILOT_STUDIO}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Copilot Studio');
  await expect(page.locator('[data-doc-host]')).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as { __spaMarker?: number }).__spaMarker)).toBe(1);
});

test('SPA: scroll-padding-top is set while a doc is mounted and removed when leaving to a non-doc page', async ({
  page,
}) => {
  await page.goto(COPILOT_STUDIO);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const padding = () => page.evaluate(() => document.documentElement.style.scrollPaddingTop);
  expect(await padding()).toBe('calc(var(--dn-nav-h) + var(--doc-bar-h))');
  const nav = await navHeight(page);
  const bar = await barBottom(page);
  expect(
    await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)),
  ).toBeCloseTo(bar, 0);
  expect(bar).toBeGreaterThan(nav);
  await hostLocator(page).locator('a[href$="/artifacts"]').last().click();
  await expect(page).toHaveURL(/\/artifacts$/);
  await expect(page.locator('[data-doc-host]')).toHaveCount(0);
  expect(await padding()).toBe('');
});

test('Meta/Ctrl-click on the sibling-sheet link opens a new page and leaves the original URL unchanged', async ({
  page,
  context,
}) => {
  await page.goto(COPILOT_STUDIO);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const before = page.url();
  const link = hostLocator(page).locator('a[href$="/artifacts/llm-best-practices-github-copilot"]').last();
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    link.click({ modifiers: [modifier] }),
  ]);
  await popup.waitForURL(new RegExp(`${GITHUB_COPILOT}$`));
  expect(page.url()).toBe(before);
  await popup.close();
});

test('reduced motion: #c07 is in place on the first animation frame after the click', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(COPILOT_STUDIO);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const nav = await barBottom(page);
  const top = await hostLocator(page).evaluate(
    (el) =>
      new Promise<number>((resolve) => {
        el.shadowRoot!.querySelector<HTMLElement>('.rail a[href="#c07"]')!.click();
        requestAnimationFrame(() => resolve(el.shadowRoot!.getElementById('c07')!.getBoundingClientRect().top));
      }),
  );
  expect(top).toBeGreaterThanOrEqual(nav - 0.5);
  expect(top).toBeLessThanOrEqual(nav + 32 + 0.5);
});

test('focus-visible: Tab to the #c07 rail link, Enter moves focus to the clause, next Tab goes past it', async ({
  page,
  browserName,
}) => {
  const TAB = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.goto(COPILOT_STUDIO);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

  const activeHref = () =>
    page.evaluate(() => document.querySelector('[data-doc-host]')?.shadowRoot?.activeElement?.getAttribute('href') ?? null);
  await page.keyboard.press(TAB);
  let found = false;
  for (let i = 0; i < 80 && !found; i++) {
    if ((await activeHref()) === '#c07') found = true;
    else await page.keyboard.press(TAB);
  }
  expect(found, 'reached the #c07 rail link by keyboard').toBe(true);

  const outline = await page.evaluate(() => {
    const a = document.querySelector('[data-doc-host]')!.shadowRoot!.activeElement!;
    const cs = getComputedStyle(a);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThan(0);

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#c07$/);
  await expectInPlace(page, 'c07');

  // The next Tab goes to the first focusable element after the clause start
  const expected = await hostLocator(page).evaluate((el) => {
    const root = el.shadowRoot!;
    const clause = root.getElementById('c07')!;
    const sel = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const next = [...root.querySelectorAll(sel)].find(
      (n) => clause.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    return next ? (next.getAttribute('href') ?? next.id) : null;
  });
  expect(expected).not.toBeNull();
  await page.keyboard.press(TAB);
  const after = await page.evaluate(() => {
    const a = document.querySelector('[data-doc-host]')!.shadowRoot!.activeElement;
    return a ? (a.getAttribute('href') ?? a.id) : null;
  });
  expect(after).toBe(expected);
});

// ---------------------------------------------------------------------------
// UNIT-004 (#49): the reader frame
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { name: '1280px', width: 1280, height: 800 },
  { name: '390px', width: 390, height: 812 },
];

for (const vp of VIEWPORTS) {
  for (const route of DOC_ROUTES) {
    test(`reader frame ${route} @ ${vp.name}: one h1, one main, one-line sticky bar, edge-to-edge host, no overflow`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route);
      await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);

      const bar = page.getByRole('navigation', { name: 'Doc' });
      await expect(bar).toBeVisible();
      const barBox = await bar.boundingBox();
      expect(barBox!.height).toBeLessThanOrEqual(44);
      const open = bar.getByRole('link', { name: 'Open standalone' });
      const openBox = await open.boundingBox();
      expect(openBox!.x).toBeGreaterThanOrEqual(0);
      expect(openBox!.x + openBox!.width).toBeLessThanOrEqual(vp.width);
      expect(openBox!.y).toBeGreaterThanOrEqual(barBox!.y);
      expect(openBox!.y + openBox!.height).toBeLessThanOrEqual(barBox!.y + barBox!.height);
      // The back link never wraps or truncates.
      const back = bar.getByRole('link').first();
      const backFits = await back.evaluate((el) => el.scrollWidth <= el.clientWidth && el.getClientRects().length === 1);
      expect(backFits).toBe(true);

      // Host: edge to edge, the viewport width minus any scrollbar.
      const hostBox = await hostLocator(page).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, width: r.width, client: document.documentElement.clientWidth };
      });
      expect(hostBox.left).toBe(0);
      expect(hostBox.width).toBe(hostBox.client);

      // Sticky: after scrolling 2000px the bar's top equals --dn-nav-h.
      await page.evaluate(() => window.scrollTo(0, 2000));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      const nav = await navHeight(page);
      await expect.poll(() => bar.evaluate((el) => el.getBoundingClientRect().top)).toBeCloseTo(nav, 0);

      await noHorizontalOverflow(page);
      expect(errors).toEqual([]);
    });
  }

  test.describe(`copilot studio anchor @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('clicking #c07 leaves the clause top edge below the bar bottom edge', async ({ page }) => {
      await page.goto(COPILOT_STUDIO);
      await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
      await hostLocator(page).locator('.rail a[href="#c07"]').click();
      await expect(page).toHaveURL(/#c07$/);
      await expect
        .poll(async () => {
          const top = (await targetState(page, 'c07')).top;
          return top !== null && top >= (await barBottom(page)) - 0.5;
        })
        .toBe(true);
    });
  });
}

test('reader frame: the old strip is gone; bar and colophon carry the exact copy', async ({ page }) => {
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const bar = page.getByRole('navigation', { name: 'Doc' });
  await expect(bar.getByRole('link', { name: '\u2190 Behind the scenes' })).toHaveAttribute('href', '/artifacts');
  await expect(bar).toContainText('Doc \u00b7 Slamwich');
  await expect(bar.getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
    'href',
    '/artifact-docs/slamwich-tasting-report.html',
  );
  const colophon = page.locator('footer', { has: page.getByRole('heading', { level: 2, name: 'About this doc' }) });
  await expect(colophon).toContainText('SLAMWICH Tasting Report');
  await expect(colophon).toContainText('Published 2026-08-08');
  await expect(colophon).toContainText('localhost:9021');
  await expect(page.locator('.artifact-strip')).toHaveCount(0);

  await page.goto('/weekly/2026-08-08');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const wbar = page.getByRole('navigation', { name: 'Doc' });
  await expect(wbar.getByRole('link', { name: '\u2190 Weekly reports' })).toHaveAttribute('href', '/weekly');
  await expect(wbar).toContainText('Weekly report');
  const wcol = page.locator('footer', { has: page.getByRole('heading', { level: 2, name: 'About this doc' }) });
  await expect(wcol).toContainText('Weekly report');
  await expect(wcol).toContainText('Run 2026-08-08, covering 2026-08-03 to 2026-08-08');
});

test('print: the site nav, reader bar and site footer are hidden; the colophon is visible', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Doc' })).toBeHidden();
  await expect(page.locator('footer#footer')).toBeHidden();
  await expect(page.getByRole('heading', { level: 2, name: 'About this doc' })).toBeVisible();
  await expect(hostLocator(page)).toBeVisible();
});

test('print rules do not hide the site nav and footer on non-viewer routes', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/artifacts');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.locator('footer#footer')).toBeVisible();
});

test('reduced motion: the bar links and colophon have no transitions or animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  const bar = page.getByRole('navigation', { name: 'Doc' });
  const links = bar.getByRole('link');
  await expect(links).toHaveCount(2);
  for (const link of await links.all()) {
    const seconds = await link.evaluate((el) => {
      const d = getComputedStyle(el).transitionDuration;
      return Math.max(...d.split(',').map((x) => parseFloat(x)));
    });
    expect(seconds).toBeLessThan(0.001);
  }
  const running = await page.evaluate(() => {
    const colophon = document.querySelector('.doc-colophon');
    const nodes = [
      ...document.querySelectorAll('.doc-bar, .doc-bar *'),
      ...(colophon ? [colophon, ...colophon.querySelectorAll('*')] : []),
    ];
    return nodes.reduce((n, el) => n + el.getAnimations().length, 0);
  });
  expect(running).toBe(0);
});

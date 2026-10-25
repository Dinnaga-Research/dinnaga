// ABOUTME: E2E tests for shadow-DOM doc viewer — all 11 routes at multiple viewports.
// ABOUTME: Covers: mounting, colors, overflow, forced-dark, missing doc, focus/motion.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { DOC_ROUTES, hostLocator, noHorizontalOverflow } from './helpers/docViewer';

// Expected forced-dark colors (from ticket #46)
const FORCED_DARK_COLORS: Record<string, string> = {
  'slamwich-tasting-report': 'rgb(14, 14, 14)',
  'llm-best-practices-copilot-studio': 'rgb(18, 18, 16)',
  '2026-08-08': 'rgb(17, 17, 20)',
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
  // fills the host. Its colour is the ticket's rgb(17, 17, 20).
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

  // The error link (exact name) sits beside the strip's "Open standalone →" link.
  const link = page.getByRole('link', { name: 'Open standalone', exact: true });
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

test('focus-visible: skip link, strip link, doc link have outlines', async ({ page, browserName }) => {
  // macOS WebKit only tabs to links with Option held (Safari default)
  const TAB = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.goto('/artifacts/slamwich-tasting-report');
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');

  const visibleOutline = () =>
    page.evaluate(() => {
      let el: Element | null = document.activeElement;
      while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        style: cs.outlineStyle,
        width: parseFloat(cs.outlineWidth),
      };
    });

  // Tab from the page start: skip link first, then through the nav to the strip link.
  await page.keyboard.press(TAB);
  let seenStrip = false;
  let seenDocLink = false;
  for (let i = 0; i < 40 && !seenDocLink; i++) {
    const o = await visibleOutline();
    expect(o, `tab stop ${i}`).not.toBeNull();
    expect(o!.style, `outline style at stop ${i} (${o!.tag})`).not.toBe('none');
    expect(o!.width, `outline width at stop ${i} (${o!.tag})`).toBeGreaterThan(0);
    const inDoc = await page.evaluate(
      () => !!document.querySelector('[data-doc-host]')?.shadowRoot?.activeElement,
    );
    if (await page.evaluate(() => document.activeElement?.classList.contains('artifact-open'))) {
      seenStrip = true;
    }
    if (inDoc) seenDocLink = true;
    else await page.keyboard.press(TAB);
  }
  expect(seenStrip).toBe(true);
  expect(seenDocLink).toBe(true);
});

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

async function expectInPlace(page: Page, id: string) {
  const nav = await navHeight(page);
  expect(nav).toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const s = await targetState(page, id);
      return s.top !== null && s.top >= nav - 0.5 && s.top <= nav + 32 + 0.5;
    }, { message: `#${id} top edge between nav-h (${nav}) and nav-h + 32px` })
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
  expect(await padding()).toBe('var(--dn-nav-h)');
  expect(
    await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)),
  ).toBeGreaterThan(0);
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
  const nav = await navHeight(page);
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

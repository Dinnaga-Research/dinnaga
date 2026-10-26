// ABOUTME: E2E for Quartz pages in the shadow-DOM viewer (#50, #51) via the dev harness route.
// ABOUTME: Serves the synthetic fixture under a fake prefix; covers article-only, theme, callouts, links.
import { expect, test, type Page } from '@playwright/test';
import { hostLocator, noHorizontalOverflow } from './helpers/docViewer';
import { fixturePages, harnessUrl, serveQuartz, watchErrors, type Build } from './helpers/quartz';

async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
}

const VIEWPORTS = [
  { name: '1280', width: 1280, height: 800 },
  { name: '390', width: 390, height: 844 },
];

// ---------- #50: every page of both fixtures, at both widths ----------
for (const build of ['build-a', 'build-b'] as Build[]) {
  for (const vp of VIEWPORTS) {
    for (const pagePath of fixturePages(build)) {
      test(`${build}/${pagePath} @ ${vp.name}px: title, article, one h1 and main, no chrome, no overflow, no errors`, async ({
        page,
        context,
      }) => {
        await serveQuartz(context);
        const errors = watchErrors(page);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await open(page, harnessUrl(build, pagePath));
        const host = hostLocator(page);

        // Page title h1 and article text are visible
        const h1 = page.getByRole('heading', { level: 1 });
        await expect(h1).toHaveCount(1);
        await expect(h1).toBeVisible();
        await expect(host.locator('article')).toBeVisible();
        expect(((await host.locator('article').textContent()) ?? '').trim().length).toBeGreaterThan(0);
        await expect(host.locator('h1.article-title')).toHaveCount(1);

        // Exactly one main, and no navigation chrome
        await expect(page.locator('main')).toHaveCount(1);
        await expect(
          host.locator('.sidebar, .explorer, .search, .graph, .backlinks, .breadcrumb-container, footer'),
        ).toHaveCount(0);

        // No page-level horizontal overflow
        await noHorizontalOverflow(page);

        // Images that exist have loaded
        const imgs = await host.evaluate((el) =>
          [...el.shadowRoot!.querySelectorAll('img')].map((i) => ({ src: i.src, w: i.naturalWidth })),
        );
        for (const img of imgs) expect(img.w, img.src).toBeGreaterThan(0);
        if (pagePath === 'tools/ripgrep.html') expect(imgs.length).toBeGreaterThan(0);

        // KaTeX renders in a KaTeX font
        if (pagePath === 'index.html') {
          await expect(host.locator('.katex').first()).toBeVisible();
          await expect
            .poll(() =>
              page.evaluate(async () => {
                await document.fonts.ready;
                const faces = [...document.fonts].filter((f) => f.family.includes('KaTeX_Main'));
                return {
                  check: document.fonts.check('16px KaTeX_Main'),
                  loaded: faces.some((f) => f.status === 'loaded'),
                };
              }),
            )
            .toEqual({ check: true, loaded: true });
        }

        expect(errors).toEqual([]);
      });
    }
  }
}

test('build-a: the adopted sheet has no html, body or :root type selectors left, and 500+ were rewritten', async ({
  page,
  context,
}) => {
  await serveQuartz(context);
  await open(page, harnessUrl('build-a', 'index.html'));
  const result = await hostLocator(page).evaluate((el) => {
    const sheet = el.shadowRoot!.adoptedStyleSheets[0]!;
    const selectors: string[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const r of rules) {
        if (r instanceof CSSStyleRule) selectors.push(r.selectorText);
        const nested = (r as unknown as { cssRules?: CSSRuleList }).cssRules;
        if (nested) walk(nested);
      }
    };
    walk(sheet.cssRules);
    const strip = (s: string) =>
      s.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""').replace(/\[[^\]]*\]/g, '[]');
    const bad = selectors.filter((s) => {
      const t = strip(s);
      return /(^|[\s>+~,(])(html|body)(?![\w-])/i.test(t) || t.includes(':root');
    });
    const rewritten = selectors.filter((s) => s.includes(':host(') || s.includes('doc-body'));
    return { total: selectors.length, bad, rewritten: rewritten.length };
  });
  expect(result.bad).toEqual([]);
  expect(result.rewritten).toBeGreaterThan(500);
});

test('build-a: the host is saved-theme dark on screen (light OS) and light in print', async ({ page, context }) => {
  await serveQuartz(context);
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, harnessUrl('build-a', 'index.html'));
  const host = hostLocator(page);
  await expect(host).toHaveAttribute('saved-theme', 'dark');
  await page.emulateMedia({ media: 'print' });
  await expect(host).toHaveAttribute('saved-theme', 'light');
  await page.emulateMedia({ media: 'screen' });
  await expect(host).toHaveAttribute('saved-theme', 'dark');
});

test('build-a: the article renders dark on screen', async ({ page, context }) => {
  await serveQuartz(context);
  await page.emulateMedia({ colorScheme: 'light' });
  await open(page, harnessUrl('build-a', 'index.html'));
  const bg = await hostLocator(page).evaluate((el) => {
    const body = el.shadowRoot!.querySelector('doc-body')!;
    return getComputedStyle(body).backgroundColor;
  });
  const [r, g, b] = bg.match(/\d+/g)!.map(Number);
  expect((r! + g! + b!) / 3).toBeLessThan(80);
});

test('Tab from the bar into the article reaches the first article link with a visible outline', async ({
  page,
  context,
  browserName,
}) => {
  await serveQuartz(context);
  await open(page, harnessUrl('build-b', 'index.html'));
  // WebKit on macOS skips links in the Tab order unless Alt is held
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.locator('a.doc-bar-open').focus();
  let outline: { style: string; width: string; tag: string } | null = null;
  for (let i = 0; i < 8 && !outline; i++) {
    await page.keyboard.press(tab);
    outline = await hostLocator(page).evaluate((el) => {
      const a = el.shadowRoot!.activeElement;
      if (!a || a.localName !== 'a') return null;
      const cs = getComputedStyle(a);
      return { style: cs.outlineStyle, width: cs.outlineWidth, tag: a.localName };
    });
  }
  expect(outline, 'Tab reached an article link').not.toBeNull();
  expect(outline!.style).not.toBe('none');
  expect(parseFloat(outline!.width)).toBeGreaterThan(0);
});

// ---------- #51: callouts ----------
for (const vp of VIEWPORTS) {
  test.describe(`callouts @ ${vp.name}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    const heights = (page: Page) =>
      hostLocator(page).evaluate((el) => {
        const outer = el.shadowRoot!.querySelector('.callout[data-callout="note"]')!;
        const inner = outer.querySelector('.callout[data-callout="warning"]')!;
        return {
          outer: outer.querySelector(':scope > .callout-content')!.getBoundingClientRect().height,
          nested: inner.getBoundingClientRect().height,
          nestedContent: inner.querySelector('.callout-content')!.getBoundingClientRect().height,
        };
      });

    test('the collapsed callout, including the nested one, has zero rendered height', async ({ page, context }) => {
      await serveQuartz(context);
      await open(page, harnessUrl('build-b', 'index.html'));
      const h = await heights(page);
      expect(h.outer).toBe(0);
      expect(h.nested).toBe(0);
      expect(h.nestedContent).toBe(0);
    });

    test('clicking the title shows it, and clicking again hides it', async ({ page, context }) => {
      await serveQuartz(context);
      await open(page, harnessUrl('build-b', 'index.html'));
      const title = hostLocator(page).getByRole('button', { name: /Collapsed callout/ });
      await expect(title).toHaveAttribute('aria-expanded', 'false');
      await title.click();
      await expect(title).toHaveAttribute('aria-expanded', 'true');
      expect((await heights(page)).outer).toBeGreaterThan(0);
      await expect(hostLocator(page).getByText('This callout starts collapsed')).toBeVisible();
      await title.click();
      await expect(title).toHaveAttribute('aria-expanded', 'false');
      const h = await heights(page);
      expect(h.outer).toBe(0);
      expect(h.nested).toBe(0);
    });

    test('Tab to the title shows a focus outline; Enter opens it and Space closes it', async ({ page, context }) => {
      await serveQuartz(context);
      await open(page, harnessUrl('build-b', 'index.html'));
      await page.locator('a.doc-bar-open').focus();
      const focused = () =>
        hostLocator(page).evaluate((el) => {
          const a = el.shadowRoot!.activeElement;
          if (!a) return null;
          const cs = getComputedStyle(a);
          return {
            title: a.classList.contains('callout-title') && /Collapsed callout/.test(a.textContent ?? ''),
            outlineStyle: cs.outlineStyle,
            outlineWidth: cs.outlineWidth,
          };
        });
      let state = null;
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        state = await focused();
        if (state?.title) break;
      }
      expect(state?.title, 'Tab reached the callout title').toBe(true);
      expect(state!.outlineStyle).not.toBe('none');
      expect(parseFloat(state!.outlineWidth)).toBeGreaterThanOrEqual(2);
      const title = hostLocator(page).getByRole('button', { name: /Collapsed callout/ });
      await page.keyboard.press('Enter');
      await expect(title).toHaveAttribute('aria-expanded', 'true');
      expect((await heights(page)).outer).toBeGreaterThan(0);
      await page.keyboard.press('Space');
      await expect(title).toHaveAttribute('aria-expanded', 'false');
      expect((await heights(page)).outer).toBe(0);
    });
  });
}

// ---------- #51: internal links ----------
const NOTE_URL = (build: Build, page: string, hash = '') => harnessUrl(build, page, hash);

test('SPA: the cross-folder wikilink opens in place, lands at the top, and Back returns', async ({ page, context }) => {
  await serveQuartz(context);
  await open(page, harnessUrl('build-b', 'index.html'));
  await page.evaluate(() => {
    (window as unknown as { __spaMarker: number }).__spaMarker = 1;
  });
  await hostLocator(page).getByRole('link', { name: 'the ripgrep note' }).click();

  const target = NOTE_URL('build-b', 'tools/ripgrep.html');
  await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe(target);
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('heading', { level: 1, name: 'Ripgrep notes' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __spaMarker?: number }).__spaMarker)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.goBack();
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('heading', { level: 1, name: 'Harbour field notes' })).toBeVisible();
  expect(new URL(page.url()).search).toBe(new URL(harnessUrl('build-b', 'index.html'), page.url()).search);
  expect(await page.evaluate(() => (window as unknown as { __spaMarker?: number }).__spaMarker)).toBe(1);
});

async function expectHeadingBelowBar(page: Page) {
  const heading = hostLocator(page).locator('#spring-tides');
  await expect(heading).toHaveAttribute('data-doc-target', '');
  // Settled right up under the reader bar (gap 0, small tolerance), not merely somewhere below it
  await expect
    .poll(async () => {
      const bar = await page.locator('nav[aria-label="Doc"]').boundingBox();
      const h = await heading.boundingBox();
      if (!bar || !h) return false;
      const gap = h.y - (bar.y + bar.height);
      return gap >= -1 && gap <= 4;
    })
    .toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
}

test('heading link: clicking it lands with the heading below the reader bar and marked data-doc-target', async ({
  page,
  context,
}) => {
  await serveQuartz(context);
  await open(page, harnessUrl('build-b', 'index.html'));
  await page.evaluate(() => {
    (window as unknown as { __spaMarker: number }).__spaMarker = 1;
  });
  await hostLocator(page).getByRole('link', { name: /Spring tides/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tide guide' })).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#spring-tides');
  await expectHeadingBelowBar(page);
  expect(await page.evaluate(() => (window as unknown as { __spaMarker?: number }).__spaMarker)).toBe(1);
});

test('heading link: a hard load of that URL lands the same way', async ({ page, context }) => {
  await serveQuartz(context);
  await open(page, NOTE_URL('build-b', 'guides/tides.html', '#spring-tides'));
  await expectHeadingBelowBar(page);
});

test('Meta/Ctrl-click on a wikilink opens a new page at the in-app route, not a file path', async ({
  page,
  context,
}) => {
  await serveQuartz(context);
  await open(page, harnessUrl('build-b', 'index.html'));
  const link = hostLocator(page).getByRole('link', { name: 'the ripgrep note' });
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    link.click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await popup.waitForURL(/\/dev\/doc/);
  const url = new URL(popup.url());
  expect(url.pathname).toBe('/dev/doc');
  expect(url.searchParams.get('path')).toBe('/__fixtures__/quartz/build-b/tools/ripgrep.html');
  await expect(hostLocator(popup)).toHaveAttribute('aria-busy', 'false');
  await expect(popup.getByRole('heading', { level: 1, name: 'Ripgrep notes' })).toBeVisible();
  // The original page did not navigate
  expect(new URL(page.url()).pathname).toBe('/dev/doc');
  expect(new URL(page.url()).searchParams.get('path')).toContain('index.html');
});

// ---------- reduced motion ----------
test.describe('reduced motion', () => {
  test('the mounted page shows no animation or transition', async ({ page, context }) => {
    await serveQuartz(context);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, harnessUrl('build-a', 'index.html'));
    const motion = await hostLocator(page).evaluate((el) => {
      const all = [...el.shadowRoot!.querySelectorAll('*')];
      return {
        animated: all.filter((n) => getComputedStyle(n).animationName !== 'none').length,
        transitioned: all.filter((n) => getComputedStyle(n).transitionDuration.split(',').some((d) => parseFloat(d) > 0)).length,
        running: document.getAnimations().length,
      };
    });
    expect(motion).toEqual({ animated: 0, transitioned: 0, running: 0 });
  });

  test('callout toggling has no transition', async ({ page, context }) => {
    await serveQuartz(context);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, harnessUrl('build-b', 'index.html'));
    const title = hostLocator(page).getByRole('button', { name: /Collapsed callout/ });
    await title.click();
    const after = await hostLocator(page).evaluate((el) => {
      const parts = ['.callout', '.callout-title', '.callout-content', '.fold-callout-icon', '.callout-fold'];
      const durations = parts.flatMap((sel) =>
        [...el.shadowRoot!.querySelectorAll(sel)].map((n) => getComputedStyle(n).transitionDuration),
      );
      return { durations, running: document.getAnimations().length };
    });
    expect(after.durations.every((d) => d.split(',').every((x) => parseFloat(x) === 0))).toBe(true);
    expect(after.running).toBe(0);
    await expect(title).toHaveAttribute('aria-expanded', 'true');
  });
});

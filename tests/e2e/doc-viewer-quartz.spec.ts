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
});

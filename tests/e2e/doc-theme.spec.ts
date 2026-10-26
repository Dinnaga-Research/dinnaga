// ABOUTME: E2E for the doc theme mapping (#52, #53) — every doc route and both Quartz builds,
// ABOUTME: at 1280 and 390 under a light OS, plus print, display headings and focus outlines.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  composite,
  contrastRatio,
  DOC_ROUTE_FAMILY,
  DOC_ROUTES,
  hostLocator,
  noHorizontalOverflow,
  parseRgb,
  THEME_ROLES,
  type ThemeFamily,
} from './helpers/docViewer';
import { fixturePages, harnessUrl, serveQuartz, watchErrors, type Build } from './helpers/quartz';

const LIME = 'rgb(192, 254, 4)';
// --doc-* resolved values (§13.1)
const BG = 'rgb(10, 10, 10)';
const SURFACE = 'rgb(20, 20, 20)';
const TEXT = 'rgb(232, 232, 232)';
const MUTED = 'rgb(184, 184, 184)';
const BODY_FACE = '"Atkinson Hyperlegible Next"';
const DISPLAY_FACE = '"Archivo Expanded"';

const VIEWPORTS = [
  { name: '1280', width: 1280, height: 800 },
  { name: '390', width: 390, height: 844 },
];

interface Target {
  label: string;
  family: ThemeFamily;
  open: (page: Page, context: BrowserContext) => Promise<void>;
}

async function mounted(page: Page) {
  await expect(hostLocator(page)).toHaveAttribute('aria-busy', 'false');
}

const TARGETS: Target[] = [
  ...DOC_ROUTES.map(
    (route): Target => ({
      label: route,
      family: DOC_ROUTE_FAMILY[route]!,
      open: async (page) => {
        await page.goto(route);
        await mounted(page);
      },
    }),
  ),
  ...(['build-a', 'build-b'] as Build[]).flatMap((build) =>
    fixturePages(build).map(
      (p): Target => ({
        label: `quartz ${build}/${p}`,
        family: 'quartz',
        open: async (page, context) => {
          await serveQuartz(context);
          await page.goto(harnessUrl(build, p));
          await mounted(page);
        },
      }),
    ),
  ),
];

/** Resolve each variable on the host: its raw value and the colour it paints. */
async function readVariables(page: Page, vars: string[]) {
  return hostLocator(page).evaluate((host, names) => {
    const sr = host.shadowRoot!;
    const probe = document.createElement('i');
    sr.appendChild(probe);
    const out: Record<string, { raw: string; colour: string }> = {};
    for (const v of names) {
      probe.style.backgroundColor = '';
      probe.style.backgroundColor = `var(${v})`;
      out[v] = {
        raw: getComputedStyle(host).getPropertyValue(v).trim(),
        colour: getComputedStyle(probe).backgroundColor,
      };
    }
    probe.remove();
    return out;
  }, vars);
}

/** The ground the reader sees: the host's, else the doc-body's when the host is transparent. */
async function grounds(page: Page) {
  return hostLocator(page).evaluate((host) => ({
    host: getComputedStyle(host).backgroundColor,
    body: getComputedStyle(host.shadowRoot!.querySelector('doc-body')!).backgroundColor,
    bodyText: getComputedStyle(host.shadowRoot!.querySelector('doc-body')!).color,
  }));
}

// ---------- the criteria, as checks on an opened page ----------

async function checkGround(page: Page, family: ThemeFamily) {
  const g = await grounds(page);
  if (family === 'weekly') {
    // the ground sits on body{background:var(--bg)}; the host is transparent
    expect(g.host).toBe('rgba(0, 0, 0, 0)');
    expect(g.body).toBe(BG);
  } else if (family === 'quartz') {
    expect([g.host, g.body]).toContain(BG);
  } else {
    expect(g.host).toBe(BG);
  }
  // and the text on that ground is --doc-text, whichever variable the doc reads it from
  expect(g.bodyText).toBe(TEXT);
}

async function checkVariables(page: Page, family: ThemeFamily) {
  const roles = THEME_ROLES[family];
  const resolved = await readVariables(page, roles.colours);
  for (const [v, { raw, colour }] of Object.entries(resolved)) {
    expect(raw.toLowerCase(), `${v} raw`).not.toContain('c0fe04');
    expect(raw.replace(/\s+/g, ''), `${v} raw`).not.toContain('192,254,4');
    expect(colour, `${v} resolved`).not.toBe(LIME);
    expect(colour, `${v} resolved`).not.toBe('rgba(0, 0, 0, 0)');
  }
  expect(resolved[roles.bg]!.colour).toBe(BG);
  expect(resolved[roles.text]!.colour).toBe(TEXT);
  expect(resolved[roles.muted]!.colour).toBe(MUTED);
  expect(resolved[roles.accent]!.colour).toBe(TEXT);
  if (roles.surface) expect(resolved[roles.surface]!.colour).toBe(SURFACE);
}

async function checkContrast(page: Page, family: ThemeFamily) {
  const roles = THEME_ROLES[family];
  const names = [roles.bg, roles.text, roles.muted, roles.accent, ...(roles.surface ? [roles.surface] : []), ...roles.highlights.map((h) => h.variable)];
  const r = await readVariables(page, names);
  const bg = r[roles.bg]!.colour;
  const text = r[roles.text]!.colour;
  expect(contrastRatio(text, bg), 'text on bg').toBeGreaterThanOrEqual(15);
  expect(contrastRatio(r[roles.muted]!.colour, bg), 'muted on bg').toBeGreaterThanOrEqual(9);
  expect(contrastRatio(r[roles.accent]!.colour, bg), 'accent on bg').toBeGreaterThanOrEqual(15);
  if (roles.surface) {
    const surface = r[roles.surface]!.colour;
    expect(contrastRatio(text, surface), 'text on surface').toBeGreaterThanOrEqual(15);
    expect(contrastRatio(r[roles.muted]!.colour, surface), 'muted on surface').toBeGreaterThanOrEqual(9);
  }
  for (const h of roles.highlights) {
    const ground = h.over === 'surface' ? r[roles.surface!]!.colour : bg;
    const lit = composite(r[h.variable]!.colour, ground);
    expect(contrastRatio(text, lit), `text on ${h.label}`).toBeGreaterThanOrEqual(7);
  }
}

async function checkFonts(page: Page) {
  const info = await hostLocator(page).evaluate(async (host) => {
    const body = host.shadowRoot!.querySelector('doc-body')!;
    const h1 = host.shadowRoot!.querySelector('h1')!;
    await document.fonts.load('16px "Atkinson Hyperlegible Next"');
    await document.fonts.load('800 32px "Archivo Expanded"');
    return {
      body: getComputedStyle(body).fontFamily,
      h1: getComputedStyle(h1).fontFamily,
      synthesis: getComputedStyle(host).fontSynthesis,
      bodyLoaded: document.fonts.check('16px "Atkinson Hyperlegible Next"'),
      displayLoaded: document.fonts.check('800 32px "Archivo Expanded"'),
    };
  });
  expect(info.body.startsWith(BODY_FACE), `doc-body font-family: ${info.body}`).toBe(true);
  expect(info.h1.startsWith(DISPLAY_FACE), `h1 font-family: ${info.h1}`).toBe(true);
  expect(info.bodyLoaded).toBe(true);
  expect(info.displayLoaded).toBe(true);
  expect(info.synthesis).toContain('none');
}

for (const vp of VIEWPORTS) {
  test.describe(`theme @ ${vp.name}px, light OS`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, colorScheme: 'light' });

    // The 11 doc routes: one named test per criterion
    for (const target of TARGETS.filter((t) => t.family !== 'quartz')) {
      const family = target.family;
      test(`${target.label}: ground is --doc-bg's resolved ${BG}, text is --doc-text`, async ({ page, context }) => {
        await target.open(page, context);
        await checkGround(page, family);
      });
      test(`${target.label}: mapped variables resolve to the §13.2 values and none is lime`, async ({ page, context }) => {
        await target.open(page, context);
        await checkVariables(page, family);
      });
      test(`${target.label}: text >= 15:1, muted >= 9:1, accent >= 15:1, highlights with text >= 7:1`, async ({ page, context }) => {
        await target.open(page, context);
        await checkContrast(page, family);
      });
      test(`${target.label}: doc-body renders in the site body face, h1 in the display face, fonts load`, async ({ page, context }) => {
        await target.open(page, context);
        await checkFonts(page);
      });
      test(`${target.label}: no page overflow, no console errors`, async ({ page, context }) => {
        const errors = watchErrors(page);
        await target.open(page, context);
        await page.waitForLoadState('networkidle');
        await noHorizontalOverflow(page);
        expect(errors).toEqual([]);
      });
    }

    // Every page of both Quartz builds: one navigation each, a named step per criterion
    for (const target of TARGETS.filter((t) => t.family === 'quartz')) {
      test(`${target.label}: ground, variables, contrast, fonts, overflow and errors`, async ({ page, context }) => {
        const errors = watchErrors(page);
        await target.open(page, context);
        await test.step(`ground is --doc-bg's resolved ${BG}, text is --doc-text`, () => checkGround(page, 'quartz'));
        await test.step('mapped variables resolve to the §13.2 values and none is lime', () => checkVariables(page, 'quartz'));
        await test.step('text >= 15:1, muted >= 9:1, accent >= 15:1, highlights with text >= 7:1', () => checkContrast(page, 'quartz'));
        await test.step('doc-body renders in the site body face, h1 in the display face, fonts load', () => checkFonts(page));
        await test.step('no page overflow, no console errors', async () => {
          await page.waitForLoadState('networkidle');
          await noHorizontalOverflow(page);
          expect(errors).toEqual([]);
        });
      });
    }
  });
}

// ---------- docs without their own ::selection get the neutral selection colour ----------
test('selection: a Copilot sheet has a ::selection rule in the doc sheet with the neutral colour', async ({ page }) => {
  await page.goto('/artifacts/llm-best-practices-copilot-studio');
  await mounted(page);
  const css = await hostLocator(page).evaluate((host) =>
    host.shadowRoot!.adoptedStyleSheets.flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'),
  );
  expect(css).toMatch(/::selection\s*\{\s*background:\s*rgba\(232, 232, 232, 0\.22\)/);
});

// ---------- print keeps each doc's light defaults ----------
test.describe('print', () => {
  test.use({ colorScheme: 'light' });

  test('copilot studio host is rgb(255, 255, 255) in print', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto('/artifacts/llm-best-practices-copilot-studio');
    await mounted(page);
    expect((await grounds(page)).host).toBe('rgb(255, 255, 255)');
  });

  test("slamwich's ground is its light value in print", async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto('/artifacts/slamwich-tasting-report');
    await mounted(page);
    expect((await grounds(page)).host).toBe('rgb(236, 231, 220)');
  });

  test("a weekly report's ground is its light value in print", async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto('/weekly/2026-08-08');
    await mounted(page);
    expect((await grounds(page)).body).toBe('rgb(247, 247, 248)');
  });

  test('the mapping does not apply in print: the doc variables keep their own light values', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto('/artifacts/slamwich-tasting-report');
    await mounted(page);
    const r = await readVariables(page, ['--ground', '--ink']);
    expect(r['--ground']!.colour).not.toBe(BG);
    expect(r['--ink']!.colour).not.toBe(TEXT);
    expect(parseRgb(r['--ink']!.colour)[0]).toBeLessThan(80);
  });

  test('a Quartz page prints light', async ({ page, context }) => {
    await serveQuartz(context);
    await page.emulateMedia({ media: 'print' });
    await page.goto(harnessUrl('build-a', 'index.html'));
    await mounted(page);
    const g = await grounds(page);
    const lum = (c: string) => parseRgb(c).slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    expect(lum(g.host) > 200 || lum(g.body) > 200 || g.body === 'rgba(0, 0, 0, 0)').toBe(true);
    expect(g.body).not.toBe(BG);
  });
});

// ---------- focus-visible: the doc's own outline survives, one doc per family ----------
const FOCUS_TARGETS: { label: string; open: Target['open'] }[] = [
  { label: 'copilot studio', open: async (page) => { await page.goto('/artifacts/llm-best-practices-copilot-studio'); await mounted(page); } },
  { label: 'slamwich', open: async (page) => { await page.goto('/artifacts/slamwich-tasting-report'); await mounted(page); } },
  { label: 'weekly 2026-08-08', open: async (page) => { await page.goto('/weekly/2026-08-08'); await mounted(page); } },
  {
    label: 'quartz build-b index',
    open: async (page, context) => {
      await serveQuartz(context);
      await page.goto(harnessUrl('build-b', 'index.html'));
      await mounted(page);
    },
  },
];

for (const f of FOCUS_TARGETS) {
  test(`focus-visible: ${f.label}'s first doc link keeps a visible outline`, async ({ page, context, browserName }) => {
    await f.open(page, context);
    // macOS WebKit only tabs to links with Option held (Safari default)
    const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    let outline: { style: string; width: number } | null = null;
    for (let i = 0; i < 30 && !outline; i++) {
      await page.keyboard.press(tab);
      outline = await hostLocator(page).evaluate((el) => {
        const a = el.shadowRoot!.activeElement;
        if (!a || a.localName !== 'a') return null;
        const cs = getComputedStyle(a);
        return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
      });
    }
    expect(outline, 'Tab reached a doc link').not.toBeNull();
    expect(outline!.style).not.toBe('none');
    expect(outline!.width).toBeGreaterThan(0);
  });
}

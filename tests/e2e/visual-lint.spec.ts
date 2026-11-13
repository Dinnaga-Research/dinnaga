// ABOUTME: Rendered checks for the Darkroom system (spec §10): warm-black ground, red only on tested
// ABOUTME: marks and the stamp, caps only in condensed roles, text ≥ 12px, Archivo loaded, font budget.
import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  '/',
  '/atisha',
  '/building',
  '/method',
  '/colophon',
  '/backstage',
  '/atisha/slamwich-tasting-report',
  '/no-such-page',
];
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const RED = 'rgb(232, 73, 45)';
const DELETED_FONTS = /archivo-expanded|jetbrains|departure/i;

async function open(page: Page, path: string) {
  await page.route('**/api/living', (route) => route.abort());
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of VIEWPORTS) {
  for (const path of ROUTES) {
    test.describe(`${path} at ${viewport.width}px`, () => {
      test.use({ viewport });

      test('ground, red, caps, text size and Archivo', async ({ page }) => {
        const fontRequests: string[] = [];
        page.on('request', (r) => {
          if (r.resourceType() === 'font' || /\.woff2?$/.test(r.url())) fontRequests.push(r.url());
        });
        await open(page, path);

        expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(13, 12, 11)');
        expect(await page.evaluate(() => document.fonts.check('600 13px Archivo'))).toBe(true);
        expect(fontRequests.filter((u) => DELETED_FONTS.test(u))).toEqual([]);

        const problems = await page.evaluate((red) => {
          const out: string[] = [];
          const props = [
            'color',
            'backgroundColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor',
            'textDecorationColor',
          ] as const;
          const name = (el: Element) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}`;
          for (const el of Array.from(document.querySelectorAll('body *'))) {
            const exempt = !!el.closest('.tested-mark, .stamp');
            for (const pseudo of [null, '::before', '::after']) {
              const cs = getComputedStyle(el, pseudo);
              for (const p of props) {
                if (cs[p] === red && !exempt) out.push(`red: ${name(el)}${pseudo ?? ''} ${p}`);
              }
            }
            if (el.closest('[aria-hidden="true"]')) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const hasText = Array.from(el.childNodes).some(
              (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
            );
            if (!hasText) continue;
            const size = parseFloat(cs.fontSize);
            if (size < 12) out.push(`size: ${name(el)} ${cs.fontSize}`);
            if (cs.textTransform === 'uppercase') {
              if (parseFloat(cs.fontStretch) > 75) out.push(`caps: ${name(el)} at ${cs.fontStretch}`);
              const ls = parseFloat(cs.letterSpacing);
              if (!Number.isNaN(ls) && ls > 0.08 * size + 0.01) out.push(`tracking: ${name(el)} ${cs.letterSpacing}`);
            }
            if (/^H[1-6]$/.test(el.tagName) && cs.textTransform !== 'none') out.push(`heading caps: ${name(el)}`);
            if (!cs.fontFamily.replace(/"/g, '').startsWith('Archivo') && !el.closest('[data-doc-host]')) {
              out.push(`family: ${name(el)} ${cs.fontFamily}`);
            }
          }
          return out;
        }, RED);
        expect(problems).toEqual([]);
      });
    });
  }
}

test('font bytes on a cold load of / are at most 100 KB, from Archivo only', async ({ page, browserName }) => {
  const fonts: { url: string; bytes: number }[] = [];
  page.on('response', async (r) => {
    if (/\.woff2$/.test(r.url())) fonts.push({ url: r.url(), bytes: (await r.body()).length });
  });
  await open(page, '/');
  await expect.poll(() => fonts.length).toBeGreaterThan(0);
  // WebKit loads same-origin @font-face files in no-cors mode, so it cannot reuse the (CORS) preload
  // and fetches archivo-var.woff2 twice. Count each file once there; Chromium must fetch it once.
  const files = browserName === 'webkit' ? [...new Map(fonts.map((f) => [f.url, f])).values()] : fonts;
  const total = files.reduce((n, f) => n + f.bytes, 0);
  expect(total).toBeLessThanOrEqual(100 * 1024);
  expect(files.map((f) => new URL(f.url).pathname)).toEqual(['/fonts/archivo-var.woff2']);
});

test('the nav brand mark takes the text colour', async ({ page }) => {
  await page.goto('/');
  const color = await page.locator('.site-nav__brand svg').evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(236, 228, 211)');
});

test('body keeps the default cursor and links show a pointer', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('auto');
  const link = page.locator('a[href]').first();
  expect(await link.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
});

test('reduced motion: animations and transitions last at most 1 ms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/');
  const durations = await page.evaluate(() =>
    document.getAnimations().map((a) => Number(a.effect?.getComputedTiming().duration ?? 0)),
  );
  for (const d of durations) expect(d).toBeLessThanOrEqual(1);
  const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Atisha' });
  const seconds = await link.evaluate((el) =>
    Math.max(...getComputedStyle(el).transitionDuration.split(',').map((x) => parseFloat(x))),
  );
  expect(seconds).toBeLessThan(0.001);
});

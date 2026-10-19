// ABOUTME: Rendered checks for the visual system: lime only on the tested mark, type floors, cursors.
// ABOUTME: Runs at desktop and phone widths over the public routes and a doc route (spec section 16).
import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/atisha', '/method', '/colophon', '/artifacts', '/artifacts/slamwich-tasting-report', '/nope'];
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const LIME = 'rgb(192, 254, 4)';

for (const viewport of VIEWPORTS) {
  for (const path of ROUTES) {
    test.describe(`${path} at ${viewport.width}px`, () => {
      test.use({ viewport });

      test('no element or pseudo-element computes lime', async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const hits = await page.evaluate((lime) => {
          const props = [
            'color',
            'backgroundColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor',
          ] as const;
          const found: string[] = [];
          for (const el of Array.from(document.querySelectorAll('*'))) {
            for (const pseudo of [null, '::before', '::after']) {
              const cs = getComputedStyle(el, pseudo);
              for (const p of props) {
                if (cs[p] === lime && !el.classList.contains('tested-mark')) {
                  found.push(`${el.tagName.toLowerCase()}.${el.className}${pseudo ?? ''} ${p}`);
                }
              }
            }
          }
          return found;
        }, LIME);
        expect(hits).toEqual([]);
      });

      test('text is at least 12 px and caps are mono labels with tracking at most 0.08em', async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const problems = await page.evaluate(() => {
          const out: string[] = [];
          for (const el of Array.from(document.querySelectorAll('body *'))) {
            if (el.closest('[aria-hidden="true"]')) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const hasText = Array.from(el.childNodes).some(
              (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
            );
            const name = `${el.tagName.toLowerCase()}.${el.className}`;
            const size = parseFloat(cs.fontSize);
            if (hasText && size < 12) out.push(`${name} font-size ${cs.fontSize}`);
            if (hasText && cs.textTransform === 'uppercase') {
              if (!cs.fontFamily.startsWith('"JetBrains Mono"')) out.push(`${name} uppercase in ${cs.fontFamily}`);
              const ls = parseFloat(cs.letterSpacing);
              if (!Number.isNaN(ls) && ls > 0.08 * size + 0.001) out.push(`${name} tracking ${cs.letterSpacing}`);
            }
            if (/^H[1-3]$/.test(el.tagName) && cs.textTransform !== 'none') out.push(`${name} heading transform`);
          }
          return out;
        });
        expect(problems).toEqual([]);
      });
    });
  }
}

test('the nav brand mark takes the text colour', async ({ page }) => {
  await page.goto('/');
  const color = await page.locator('.nav-brand svg').first().evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(232, 232, 232)');
});

test('body keeps the default cursor and links show a pointer', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('auto');
  const link = page.locator('a[href]').first();
  expect(await link.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
});

test('reduced motion: animations last at most 1 ms and the flicker is off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const durations = await page.evaluate(() =>
    document.getAnimations().map((a) => Number(a.effect?.getComputedTiming().duration ?? 0)),
  );
  for (const d of durations) expect(d).toBeLessThanOrEqual(1);
  const flicker = page.locator('.terminal-flicker').first();
  expect(await flicker.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('.green-square never renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.green-square')).toHaveCount(0);
});

const SURVIVING = ['/atisha', '/method', '/colophon', '/artifacts', '/artifacts/slamwich-tasting-report', '/weekly', '/weekly/2026-08-08', '/nope'];

for (const path of SURVIVING) {
  test(`${path}: no chrome prefixes, label-role eyebrows, sentence-case nav and buttons`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const r = await page.evaluate(() => {
      const bad: string[] = [];
      const eyebrows: string[] = [];
      const nav: string[] = [];
      const buttons: string[] = [];
      const surviving = (el: Element) =>
        !el.closest('.hero, .ticker, .practices, .ascii-section, .caution, .data-panel, .tx-block, [aria-hidden="true"]');
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        if (!surviving(el)) continue;
        const cs = getComputedStyle(el);
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => (n.textContent ?? '').trim())
          .join(' ')
          .trim();
        if (own && (own.startsWith('//') || /^\d{2} ·/.test(own))) bad.push(`${el.className}: ${own}`);
        if (el.classList.contains('section-eye') && own) {
          const ok =
            cs.fontFamily.startsWith('"JetBrains Mono"') &&
            cs.fontWeight === '500' &&
            cs.fontSize === '12px' &&
            cs.color === 'rgb(154, 154, 154)' &&
            parseFloat(cs.letterSpacing) <= 0.08 * 12 + 0.001;
          if (!ok) eyebrows.push(`${own} ${cs.fontFamily} ${cs.fontWeight} ${cs.fontSize} ${cs.color} ${cs.letterSpacing}`);
        }
        if (el.closest('.nav-links') && el.tagName === 'A' && cs.textTransform !== 'none') nav.push(own);
        if ((el.tagName === 'BUTTON' || el.classList.contains('btn')) && cs.textTransform === 'uppercase') {
          if (!cs.fontFamily.startsWith('"JetBrains Mono"')) buttons.push(own);
        }
      }
      return { bad, eyebrows, nav, buttons };
    });
    expect(r).toEqual({ bad: [], eyebrows: [], nav: [], buttons: [] });
  });
}

test('nav shows labels as written in the nav data', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nav-links a')).toHaveText(['Atisha', 'How we work', 'Colophon', 'Weekly']);
});

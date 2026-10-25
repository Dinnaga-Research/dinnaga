// ABOUTME: E2E tests for shadow-DOM doc viewer — all 11 routes at multiple viewports.
// ABOUTME: Covers: mounting, colors, overflow, forced-dark, missing doc, focus/motion.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
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

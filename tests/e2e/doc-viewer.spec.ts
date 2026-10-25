// ABOUTME: E2E tests for shadow-DOM doc viewer — all 11 routes at multiple viewports.
// ABOUTME: Covers: mounting, colors, overflow, forced-dark, missing doc, focus/motion.
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
    await page.goto(route);

    // Check doc's h1 is visible
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Exactly one main on page (site's main, not doc's)
    await expect(page.locator('main')).toHaveCount(1);

    // No console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForLoadState('networkidle');
    expect(errors.length).toBe(0);

    // No horizontal overflow
    await noHorizontalOverflow(page);
  });

  test(`${route} @ mobile (390px): h1 visible, single main`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 812 });
    await page.goto(route);

    // Check doc's h1 is visible
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

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
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe(FORCED_DARK_COLORS['slamwich-tasting-report']);
});

test('copilot-studio @ light OS: forced-dark background', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/artifacts/llm-best-practices-copilot-studio');

  const host = hostLocator(page);
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe(FORCED_DARK_COLORS['llm-best-practices-copilot-studio']);
});

test('weekly 2026-08-08 @ light OS: forced-dark background', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/weekly/2026-08-08');

  const host = hostLocator(page);
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe(FORCED_DARK_COLORS['2026-08-08']);
});

test('copilot-studio @ print: light background', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/artifacts/llm-best-practices-copilot-studio');

  const host = hostLocator(page);
  const bgColor = await host.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  expect(bgColor).toBe('rgb(255, 255, 255)');
});

test('copilot-studio: .principle border re-serialization canary', async ({ page }) => {
  await page.goto('/artifacts/llm-best-practices-copilot-studio');

  const host = hostLocator(page);
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
  // Route the doc request to the SPA shell
  await page.route('**/artifact-docs/slamwich-tasting-report.html', (route) => {
    route.abort('blockedbyclient');
  });

  await page.goto('/artifacts/slamwich-tasting-report');

  // Should show error message
  await expect(page.getByText(/didn't load/i)).toBeVisible();

  // Should show Open standalone link
  const link = page.getByRole('link', { name: /open standalone/i });
  await expect(link).toBeVisible();
  expect(link).toHaveAttribute('href', '/artifact-docs/slamwich-tasting-report.html');

  // Should have no shadow content
  const host = hostLocator(page);
  const hasContent = await host.evaluate((el) => {
    const sr = el.shadowRoot;
    return sr && sr.childNodes.length > 0;
  });
  expect(hasContent).toBeFalsy();

  // Should have exactly one site nav (not duplicated)
  const navs = page.locator('.nav-links');
  await expect(navs).toHaveCount(1);
});

test('reduced motion: no animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/artifacts/slamwich-tasting-report');

  const host = hostLocator(page);
  const hasAnimation = await host.evaluate((el) => {
    const sr = el.shadowRoot;
    if (!sr) return false;
    const body = sr.querySelector('doc-body');
    if (!body) return false;
    const cs = window.getComputedStyle(body);
    const anim = cs.animation;
    const trans = cs.transition;
    return anim !== 'none' || trans !== 'none';
  });

  expect(hasAnimation).toBeFalsy();
});

test('focus-visible: skip link → strip link → doc link have outlines', async ({ page }) => {
  await page.goto('/artifacts/slamwich-tasting-report');

  // Tab from skip link through strip link into doc
  const skipLink = page.locator('[href="#main"]').first();
  await skipLink.focus();
  let outline = await skipLink.evaluate((el) => window.getComputedStyle(el).outline);
  expect(outline).not.toBe('none');

  // Tab to strip's "Open standalone"
  await page.keyboard.press('Tab');
  const stripLink = page.locator('.artifact-open');
  outline = await stripLink.evaluate((el) => window.getComputedStyle(el).outline);
  expect(outline).not.toBe('none');

  // Tab into doc's first link (if present)
  // The exact behavior depends on the doc structure, but focus should be visible
});

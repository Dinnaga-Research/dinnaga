// ABOUTME: E2E test helpers for doc viewer — routes, host locator, overflow check.
// ABOUTME: Shared utilities for artifacts, weekly, and doc-viewer specs.

import { Page, expect } from '@playwright/test';

/**
 * All 11 doc routes (3 artifacts + 8 weekly)
 */
export const DOC_ROUTES = [
  // Artifacts (3)
  '/artifacts/llm-best-practices-github-copilot',
  '/artifacts/llm-best-practices-copilot-studio',
  '/artifacts/slamwich-tasting-report',
  // Weekly reports (8)
  '/weekly/2026-08-08',
  '/weekly/2026-08-15',
  '/weekly/2026-08-22',
  '/weekly/2026-08-29',
  '/weekly/2026-09-05',
  '/weekly/2026-09-12',
  '/weekly/2026-09-19',
  '/weekly/2026-09-26',
];

/**
 * Get the doc-host locator for the current page.
 * Handles shadow root piercing with Playwright's built-in support.
 */
export function hostLocator(page: Page) {
  return page.locator('[data-doc-host]');
}

/**
 * Check that the page has no horizontal overflow at the given width.
 */
export async function noHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    return Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
  });
  expect(overflow).toBe(0);
}

/**
 * Collect any console errors/warnings that occurred.
 * Call this after the page has loaded and interacted with.
 */
export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  return errors;
}

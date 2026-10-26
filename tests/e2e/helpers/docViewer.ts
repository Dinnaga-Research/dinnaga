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

/** Parse `rgb(r, g, b)`, `rgba(r, g, b, a)`, `rgb(r g b / a)` or `color(srgb …)` into [r, g, b, a]. */
export function parseRgb(color: string): [number, number, number, number] {
  // color-mix() resolves to `color(srgb 0.9 0.9 0.9 / 0.12)` with 0-1 channels
  const srgb = color.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/);
  if (srgb) {
    const alpha = srgb[4] === undefined ? 1 : srgb[4].endsWith('%') ? parseFloat(srgb[4]) / 100 : Number(srgb[4]);
    return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, alpha];
  }
  const nums = color.match(/[\d.]+/g)?.map(Number);
  if (!nums || nums.length < 3) throw new Error(`Not an rgb colour: ${color}`);
  return [nums[0]!, nums[1]!, nums[2]!, nums[3] ?? 1];
}

function luminance([r, g, b]: [number, number, number, number]): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

/** WCAG contrast ratio of two opaque computed colours, e.g. `rgb(232, 232, 232)`. */
export function contrastRatio(rgbA: string, rgbB: string): number {
  const a = luminance(parseRgb(rgbA));
  const b = luminance(parseRgb(rgbB));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Composite a (possibly translucent) colour over an opaque ground; returns an `rgb(...)` string. */
export function composite(fg: string, ground: string): string {
  const [r, g, b, a] = parseRgb(fg);
  const [gr, gg, gb] = parseRgb(ground);
  const mix = (c: number, d: number) => Math.round(c * a + d * (1 - a));
  return `rgb(${mix(r, gr)}, ${mix(g, gg)}, ${mix(b, gb)})`;
}

export type ThemeFamily = 'copilot' | 'slamwich' | 'weekly' | 'quartz';

/**
 * Per family: the doc's own variable for each role (the names the mapping targets), and the
 * highlight variables that composite over a ground with text on it.
 */
export const THEME_ROLES: Record<
  ThemeFamily,
  {
    bg: string;
    surface?: string;
    text: string;
    muted: string;
    accent: string;
    colours: string[];
    highlights: { variable: string; over: 'bg' | 'surface'; label: string }[];
  }
> = {
  copilot: {
    bg: '--ground',
    surface: '--paper',
    text: '--ink',
    muted: '--muted',
    accent: '--accent',
    colours: ['--ground', '--paper', '--ink', '--muted', '--line', '--line-soft', '--accent', '--accent-soft', '--gold', '--gold-bar', '--ghost'],
    highlights: [{ variable: '--accent-soft', over: 'surface', label: 'accent-soft on paper' }],
  },
  slamwich: {
    bg: '--ground',
    surface: '--paper',
    text: '--ink',
    muted: '--muted',
    accent: '--accent',
    colours: ['--ground', '--paper', '--ink', '--muted', '--line', '--line-soft', '--ghost', '--accent', '--accent-ink', '--gold', '--gold-soft', '--meter', '--meter-track'],
    highlights: [{ variable: '--gold-soft', over: 'surface', label: 'gold-soft on paper' }],
  },
  weekly: {
    bg: '--bg',
    surface: '--card',
    text: '--ink',
    muted: '--muted',
    accent: '--accent',
    colours: ['--bg', '--card', '--ink', '--muted', '--line', '--accent', '--accent2', '--accent3', '--chip'],
    highlights: [],
  },
  quartz: {
    bg: '--light',
    text: '--darkgray',
    muted: '--gray',
    accent: '--secondary',
    colours: ['--light', '--lightgray', '--gray', '--darkgray', '--dark', '--secondary', '--tertiary', '--highlight', '--textHighlight'],
    highlights: [
      { variable: '--highlight', over: 'bg', label: 'highlight on bg' },
      { variable: '--textHighlight', over: 'bg', label: 'textHighlight on bg' },
    ],
  },
};

export const DOC_ROUTE_FAMILY: Record<string, ThemeFamily> = {
  '/artifacts/llm-best-practices-github-copilot': 'copilot',
  '/artifacts/llm-best-practices-copilot-studio': 'copilot',
  '/artifacts/slamwich-tasting-report': 'slamwich',
  ...Object.fromEntries(DOC_ROUTES.filter((r) => r.startsWith('/weekly/')).map((r) => [r, 'weekly' as const])),
};

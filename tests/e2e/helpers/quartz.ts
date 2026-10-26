// ABOUTME: E2E helpers for the Quartz fixture — serves it under a fake prefix and lists its pages.
// ABOUTME: jsdelivr (KaTeX) is fulfilled from the vendored copy, Google Fonts CSS with an empty sheet,
// ABOUTME: and any other external request is aborted.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';

export const FIXTURE_ROOT = join(process.cwd(), 'tests/fixtures/quartz');
export const FIXTURE_PREFIX = '/__fixtures__/quartz';
export type Build = 'build-a' | 'build-b';

export function fixturePages(build: Build): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(join(FIXTURE_ROOT, build, dir))) {
      const rel = dir ? `${dir}/${name}` : name;
      if (statSync(join(FIXTURE_ROOT, build, rel)).isDirectory()) walk(rel);
      else if (name.endsWith('.html')) out.push(rel);
    }
  };
  walk('');
  return out.sort();
}

/** The harness URL that mounts `page` of `build`, optionally with a #hash. */
export function harnessUrl(build: Build, page: string, hash = ''): string {
  return `/dev/doc?path=${encodeURIComponent(`${FIXTURE_PREFIX}/${build}/${page}`)}${hash}`;
}

/**
 * Serve the fixture on the context (so new tabs get it too). Call before goto.
 * Returns the list of external URLs that were requested and aborted.
 */
export async function serveQuartz(context: BrowserContext): Promise<string[]> {
  const aborted: string[] = [];
  const cors = { 'access-control-allow-origin': '*' };
  await context.route(/^https?:\/\/(?!localhost:)/, (route) => {
    const url = new URL(route.request().url());
    const m = url.pathname.match(/^\/npm\/katex@0\.16\.11\/dist\/(.*)$/);
    if (url.hostname === 'cdn.jsdelivr.net' && m) {
      const file = join(FIXTURE_ROOT, 'vendor/katex', m[1]!);
      if (existsSync(file)) return route.fulfill({ path: file, headers: cors });
    }
    // The viewer fetches the Google Fonts sheet itself; answer it empty so an offline run logs no error.
    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ body: '', contentType: 'text/css', headers: cors });
    }
    aborted.push(url.href);
    return route.abort();
  });
  await context.route(`**${FIXTURE_PREFIX}/**`, (route) => {
    const url = new URL(route.request().url());
    const file = join(FIXTURE_ROOT, decodeURIComponent(url.pathname.slice(FIXTURE_PREFIX.length)));
    if (!file.startsWith(FIXTURE_ROOT) || !existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({ path: file, headers: cors });
  });
  return aborted;
}

/** Console errors and uncaught page errors, collected from now on. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

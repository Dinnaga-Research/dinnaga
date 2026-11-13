// ABOUTME: Test helper — reads the committed Quartz fixture pages and stubs fetch to serve them.
// ABOUTME: Maps the fake /__fixtures__/quartz prefix to tests/fixtures/quartz and jsdelivr to the vendored KaTeX.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';

export const FIXTURE_ORIGIN = 'http://localhost:4242';
export const FIXTURE_PREFIX = '/__fixtures__/quartz';
const ROOT = join(process.cwd(), 'tests/fixtures/quartz');

export function fixtureUrl(build: 'build-a' | 'build-b', page: string): URL {
  return new URL(`${FIXTURE_PREFIX}/${build}/${page}`, FIXTURE_ORIGIN);
}

export function readFixture(build: 'build-a' | 'build-b', page: string): string {
  return readFileSync(join(ROOT, build, page), 'utf-8');
}

/** Every built page in a fixture, as paths relative to the build folder. */
export function fixturePages(build: 'build-a' | 'build-b'): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(join(ROOT, build, dir))) {
      const rel = dir ? `${dir}/${name}` : name;
      if (statSync(join(ROOT, build, rel)).isDirectory()) walk(rel);
      else if (name.endsWith('.html')) out.push(rel);
    }
  };
  walk('');
  return out.sort();
}

function localFile(url: URL): string | null {
  if (url.origin === FIXTURE_ORIGIN && url.pathname.startsWith(FIXTURE_PREFIX + '/')) {
    return join(ROOT, url.pathname.slice(FIXTURE_PREFIX.length));
  }
  if (url.hostname === 'cdn.jsdelivr.net') {
    const m = url.pathname.match(/^\/npm\/katex@0\.16\.11\/dist\/(.*)$/);
    if (m) return join(ROOT, 'vendor/katex', m[1]!);
  }
  return null;
}

/** Stub global fetch so fixture pages, their CSS and the vendored KaTeX CSS resolve. */
export function stubFixtureFetch() {
  const fn = vi.fn(async (input: URL | string | Request) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const file = localFile(url);
    if (file && existsSync(file)) {
      const text = readFileSync(file, 'utf-8');
      return { ok: true, status: 200, text: async () => text };
    }
    return { ok: false, status: 404, text: async () => '' };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

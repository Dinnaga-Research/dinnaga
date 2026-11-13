// @vitest-environment node
// ABOUTME: Tests livingResponse(): status, content type, the body as given, and the cache header,
// ABOUTME: an hour when every source succeeded and five minutes when any failed.
import { describe, expect, it } from 'vitest';
import type { Living } from '../../src/lib/living/contract.js';
import { livingResponse } from './respond.js';

const ok = { ok: true, items: [] };
const bad = { ok: false, items: [] };
const body = (over: Partial<Living> = {}): Living => ({
  generatedAt: '2026-11-13T12:00:00.000Z',
  repos: ok,
  gists: ok,
  posts: ok,
  ...over,
});

describe('livingResponse', () => {
  it('answers 200 with JSON, serialising the body unchanged', async () => {
    const res = livingResponse(body());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(await res.json()).toEqual(body());
  });

  it('caches for an hour, with a day of stale-while-revalidate, when every source succeeded', () => {
    expect(livingResponse(body()).headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
  });

  it.each([
    ['repos', { repos: bad }],
    ['gists', { gists: bad }],
    ['posts', { posts: bad }],
  ])(
    'caches for five minutes when %s failed, so a passing failure is not served for an hour',
    (_n, over) => {
      expect(livingResponse(body(over)).headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=86400',
      );
    },
  );
});

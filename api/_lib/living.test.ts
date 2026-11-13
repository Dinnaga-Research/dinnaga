// @vitest-environment node
// ABOUTME: Tests the api/living handler end to end with fetch stubbed (#65): the contract body, per-source
// ABOUTME: failure, both cache headers, 5-second timeouts and the optional GITHUB_TOKEN. Lives in _lib so
// ABOUTME: Vercel doesn't deploy it as a function (it turns every non-underscore file under api/ into one).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isLiving, type Living } from '../../src/lib/living/contract.js';
import { fail, json, stubFetch, text } from '../__fixtures__/fetchStub.js';
import { RECORDED_AT } from '../__fixtures__/index.js';
import {
  allRoutes,
  FEED,
  GISTS,
  githubRoutes,
  ORG_REPOS,
  release,
  USER_REPOS,
} from '../__fixtures__/upstream.js';
import { GET } from '../living.js';

const TOKEN = 'ghp_test_not_a_real_token';
const HOUR = 'public, s-maxage=3600, stale-while-revalidate=86400';
const FIVE_MIN = 'public, s-maxage=300, stale-while-revalidate=86400';

let logs: ReturnType<typeof vi.spyOn>[];

beforeEach(() => {
  vi.stubEnv('GITHUB_TOKEN', '');
  vi.useFakeTimers({ now: RECORDED_AT, toFake: ['Date'] });
  logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
    vi.spyOn(console, m).mockImplementation(() => undefined),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const get = async () => {
  const res = await GET();
  return { res, body: (await res.json()) as Living };
};
const loggedText = () => JSON.stringify(logs.flatMap((l) => l.mock.calls));

describe('GET /api/living', () => {
  it('answers 200 JSON in the contract shape, stamped with the request time', async () => {
    stubFetch(allRoutes());
    const { res, body } = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(isLiving(body)).toBe(true);
    expect(body.generatedAt).toBe('2026-11-13T12:00:00.000Z');
  });

  it('fills all three sources from the recorded APIs', async () => {
    stubFetch(allRoutes());
    const { body } = await get();
    expect(body.repos.ok).toBe(true);
    expect(body.repos.items.map((r) => [r.name, r.release])).toEqual([
      ['dinnaga', null],
      ['living-graph', null],
      ['d3-lwc-graphql', 'v1.6.0'],
      ['d3-lwc-soql', 'v1.0.0'],
    ]);
    expect(body.gists).toEqual({
      ok: true,
      items: [
        {
          title:
            'GitHub Copilot + Playwright in VS Code: QA cheatsheet (settings, compaction, agents, safety rails)',
          url: 'https://gist.github.com/weytani/d049296faa7e3140909d8e3d8e14f829',
          updatedAt: '2026-10-18T05:07:13Z',
        },
      ],
    });
    expect(body.posts.ok).toBe(true);
    expect(body.posts.items.map((p) => p.title)).toEqual([
      'The coming storm',
      'The conversation has shifted',
      'Just the beginning...',
    ]);
  });

  it('caches for an hour when everything succeeded', async () => {
    stubFetch(allRoutes());
    const { res } = await get();
    expect(res.headers.get('Cache-Control')).toBe(HOUR);
  });

  describe('when GitHub fails', () => {
    const down = Object.fromEntries(
      Object.keys(githubRoutes()).map((url) => [url, json({ message: 'rate limited' }, 403)]),
    );

    it('fails repos and gists, keeps posts, and caches for five minutes', async () => {
      stubFetch({ ...allRoutes(), ...down });
      const { res, body } = await get();
      expect(res.status).toBe(200);
      expect(body.repos).toEqual({ ok: false, items: [] });
      expect(body.gists).toEqual({ ok: false, items: [] });
      expect(body.posts.ok).toBe(true);
      expect(body.posts.items).toHaveLength(3);
      expect(res.headers.get('Cache-Control')).toBe(FIVE_MIN);
    });

    it('does the same when GitHub cannot be reached at all', async () => {
      stubFetch({
        ...allRoutes(),
        ...Object.fromEntries(Object.keys(githubRoutes()).map((url) => [url, fail()])),
      });
      const { res, body } = await get();
      expect([body.repos.ok, body.gists.ok, body.posts.ok]).toEqual([false, false, true]);
      expect(res.headers.get('Cache-Control')).toBe(FIVE_MIN);
    });
  });

  it('fails only posts when Substack fails, and caches for five minutes', async () => {
    stubFetch({ ...allRoutes(), [FEED]: text('<html>Just a moment...</html>') });
    const { res, body } = await get();
    expect(body.posts).toEqual({ ok: false, items: [] });
    expect(body.repos.ok).toBe(true);
    expect(body.gists.ok).toBe(true);
    expect(res.headers.get('Cache-Control')).toBe(FIVE_MIN);
  });

  it('fails only repos when one listing fails, leaving gists and posts', async () => {
    stubFetch({ ...allRoutes(), [ORG_REPOS]: json({ message: 'x' }, 500) });
    const { body } = await get();
    expect([body.repos.ok, body.gists.ok, body.posts.ok]).toEqual([false, true, true]);
  });

  it('keeps a repo, with release null, when only its release lookup fails, and still caches for an hour', async () => {
    stubFetch({ ...allRoutes(), [release('weytani/d3-lwc-graphql')]: fail() });
    const { res, body } = await get();
    expect(body.repos.ok).toBe(true);
    expect(body.repos.items.find((r) => r.name === 'd3-lwc-graphql')!.release).toBeNull();
    expect(res.headers.get('Cache-Control')).toBe(HOUR);
  });

  it('still answers 200 with every source failed', async () => {
    stubFetch(Object.fromEntries(Object.keys(allRoutes()).map((url) => [url, fail()])));
    const { res, body } = await get();
    expect(res.status).toBe(200);
    expect([body.repos.ok, body.gists.ok, body.posts.ok]).toEqual([false, false, false]);
    expect(res.headers.get('Cache-Control')).toBe(FIVE_MIN);
  });

  describe('timeouts', () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: RECORDED_AT });
    });

    // Never answers, but honours the abort signal like real fetch.
    const hangOn = (hung: string[]) => {
      const routes = allRoutes();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: RequestInit) => {
          if (hung.includes(url)) {
            await new Promise((_resolve, reject) => {
              init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
            });
          }
          const route = routes[url]!;
          return (await route()) as Response;
        }),
      );
    };

    it('gives up on a source after 5 seconds and returns the others', async () => {
      hangOn([GISTS]);
      const pending = get();
      await vi.advanceTimersByTimeAsync(5000);
      const { res, body } = await pending;
      expect(body.gists).toEqual({ ok: false, items: [] });
      expect(body.repos.ok).toBe(true);
      expect(body.posts.ok).toBe(true);
      expect(res.headers.get('Cache-Control')).toBe(FIVE_MIN);
    });

    it('does not wait on a hung feed for longer than 5 seconds', async () => {
      hangOn([FEED]);
      const pending = get();
      await vi.advanceTimersByTimeAsync(4999);
      let done = false;
      void pending.then(() => (done = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect((await pending).body.posts.ok).toBe(false);
    });
  });

  describe('GITHUB_TOKEN', () => {
    it('is sent as a bearer token on every GitHub request and nowhere else', async () => {
      vi.stubEnv('GITHUB_TOKEN', TOKEN);
      const { calls } = stubFetch(allRoutes());
      await get();
      const github = calls.filter((c) => c.url.startsWith('https://api.github.com/'));
      expect(github).toHaveLength(7);
      for (const c of github) expect(c.headers.authorization).toBe(`Bearer ${TOKEN}`);
      const feedCall = calls.find((c) => c.url === FEED)!;
      expect(feedCall.headers).not.toHaveProperty('authorization');
    });

    it('never appears in the response body, the headers or the logs, even when GitHub fails', async () => {
      vi.stubEnv('GITHUB_TOKEN', TOKEN);
      stubFetch({
        ...allRoutes(),
        [USER_REPOS]: json({ message: `Bad credentials ${TOKEN}` }, 401),
        [GISTS]: fail(`connect failed (bearer ${TOKEN})`),
      });
      const res = await GET();
      const raw = await res.text();
      expect(raw).not.toContain(TOKEN);
      expect(JSON.stringify([...res.headers])).not.toContain(TOKEN);
      expect(loggedText()).not.toContain(TOKEN);
    });

    it('is absent from every request when it is not set', async () => {
      const { calls } = stubFetch(allRoutes());
      const { body } = await get();
      expect(body.repos.ok).toBe(true);
      expect(calls.length).toBeGreaterThan(0);
      for (const c of calls) expect(c.headers).not.toHaveProperty('authorization');
    });
  });
});

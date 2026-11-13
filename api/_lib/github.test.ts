// @vitest-environment node
// ABOUTME: Tests the GitHub source (#65): endpoints, request headers, the optional bearer token,
// ABOUTME: release lookups (404 and failures become null), and when a whole source fails.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixtureJson, RECORDED_AT } from '../__fixtures__/index.js';
import { fail, json, stubFetch, text } from '../__fixtures__/fetchStub.js';
import { githubRoutes, GISTS, ORG_REPOS, release, USER_REPOS } from '../__fixtures__/upstream.js';
import { loadGists, loadRepos } from './github.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('loadRepos', () => {
  it('lists the user and the org, then asks each kept repo for its latest release', async () => {
    const { calls } = stubFetch(githubRoutes());
    await loadRepos(RECORDED_AT);
    const expected = Object.keys(githubRoutes()).filter((url) => url !== GISTS);
    expect(calls.map((c) => c.url).sort()).toEqual(expected.sort());
  });

  it('returns the contract rows, newest push first, with the release tag or null on a 404', async () => {
    stubFetch(githubRoutes());
    const repos = await loadRepos(RECORDED_AT);
    expect(repos.map((r) => [`${r.owner}/${r.name}`, r.release])).toEqual([
      ['Dinnaga-Research/dinnaga', null],
      ['weytani/living-graph', null],
      ['weytani/d3-lwc-graphql', 'v1.6.0'],
      ['weytani/d3-lwc-soql', 'v1.0.0'],
    ]);
    expect(repos[0]).toEqual({
      owner: 'Dinnaga-Research',
      name: 'dinnaga',
      url: 'https://github.com/Dinnaga-Research/dinnaga',
      description: 'Dinnaga Research — the dinnaga.ai homepage (React + Vite)',
      pushedAt: '2026-11-13T05:24:37Z',
      stars: 0,
      release: null,
    });
  });

  it('only sets release to null when one lookup fails; the repo and the others stay', async () => {
    stubFetch({
      ...githubRoutes(),
      [release('weytani/living-graph')]: json({ message: 'boom' }, 500),
      [release('weytani/d3-lwc-soql')]: fail(),
      [release('Dinnaga-Research/dinnaga')]: text('<html>not json</html>'),
    });
    const repos = await loadRepos(RECORDED_AT);
    expect(repos.map((r) => [r.name, r.release])).toEqual([
      ['dinnaga', null],
      ['living-graph', null],
      ['d3-lwc-graphql', 'v1.6.0'],
      ['d3-lwc-soql', null],
    ]);
  });

  it.each([
    ['the user listing returns 500', { [USER_REPOS]: json({ message: 'x' }, 500) }],
    ['the org listing returns 403 (rate limit)', { [ORG_REPOS]: json({ message: 'x' }, 403) }],
    ['the user listing cannot connect', { [USER_REPOS]: fail() }],
    ['a listing is not JSON', { [ORG_REPOS]: text('<html>') }],
    ['a listing is not an array', { [ORG_REPOS]: json({ items: [] }) }],
  ])('rejects when %s, so the whole source fails', async (_name, override) => {
    stubFetch({ ...githubRoutes(), ...override });
    await expect(loadRepos(RECORDED_AT)).rejects.toThrow();
  });

  it('measures the 183 days from the date it is given', async () => {
    const { calls } = stubFetch({
      [USER_REPOS]: json(fixtureJson('repos-user.json')),
      [ORG_REPOS]: json(fixtureJson('repos-org.json')),
    });
    // 300 days on, nothing in the fixtures is recent enough: no release lookups at all.
    const later = new Date(RECORDED_AT.getTime() + 300 * 86_400_000);
    expect(await loadRepos(later)).toEqual([]);
    expect(calls).toHaveLength(2);
  });
});

describe('loadGists', () => {
  it('fetches the public gists listing and returns the contract rows', async () => {
    const { calls } = stubFetch({ [GISTS]: json(fixtureJson('gists.json')) });
    const gists = await loadGists();
    expect(calls.map((c) => c.url)).toEqual([GISTS]);
    expect(gists).toEqual([
      {
        title:
          'GitHub Copilot + Playwright in VS Code: QA cheatsheet (settings, compaction, agents, safety rails)',
        url: 'https://gist.github.com/weytani/d049296faa7e3140909d8e3d8e14f829',
        updatedAt: '2026-10-18T05:07:13Z',
      },
    ]);
  });

  it.each([
    ['a 500', json({ message: 'x' }, 500)],
    ['a network error', fail()],
    ['a body that is not JSON', text('nope')],
    ['a body that is not an array', json({ gists: [] })],
  ])('rejects on %s', async (_name, route) => {
    stubFetch({ [GISTS]: route });
    await expect(loadGists()).rejects.toThrow();
  });
});

describe('GitHub request headers', () => {
  const sent = async () => {
    const { calls } = stubFetch(githubRoutes());
    await Promise.all([loadRepos(RECORDED_AT), loadGists()]);
    return calls;
  };

  it('send Accept, the API version and a User-Agent on every request, and no Authorization without a token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    const calls = await sent();
    expect(calls).toHaveLength(7);
    for (const c of calls) {
      expect(c.headers).toMatchObject({
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'dinnaga.ai-living',
      });
      expect(c.headers).not.toHaveProperty('authorization');
    }
  });

  it('carry the bearer token on every request when GITHUB_TOKEN is set', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'test-token-not-real');
    const calls = await sent();
    expect(calls).toHaveLength(7);
    for (const c of calls) {
      expect(c.headers.authorization).toBe('Bearer test-token-not-real');
    }
  });

  it('treat a token that is only whitespace as absent', async () => {
    vi.stubEnv('GITHUB_TOKEN', '  ');
    const calls = await sent();
    expect(calls).toHaveLength(7);
    for (const c of calls) expect(c.headers).not.toHaveProperty('authorization');
  });
});

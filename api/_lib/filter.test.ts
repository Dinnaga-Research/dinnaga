// @vitest-environment node
// ABOUTME: Tests the repo and gist selection (#65): the 183-day window, fork/archived/profile/.github
// ABOUTME: exclusions, newest-first ordering, the 20-gist cap and gist titles. Real fixtures plus derived edge cases.
import { describe, expect, it } from 'vitest';
import { fixtureJson, RECORDED_AT } from '../__fixtures__/index.js';
import { selectGists, selectRepos } from './filter.js';

type Raw = Record<string, unknown>;
const userRepos = fixtureJson('repos-user.json') as Raw[];
const orgRepos = fixtureJson('repos-org.json') as Raw[];
const gists = fixtureJson('gists.json') as Raw[];

const DAY = 86_400_000;
const daysAgo = (n: number, from = RECORDED_AT) => new Date(from.getTime() - n * DAY).toISOString();

// A real, publishable record to derive edge cases from.
const base = userRepos.find((r) => r.name === 'd3-lwc-soql')!;
const repo = (over: Raw): Raw => ({ ...base, pushed_at: daysAgo(10), ...over });
const names = (list: { owner: string; name: string }[]) => list.map((r) => `${r.owner}/${r.name}`);

describe('selectRepos', () => {
  it('keeps the recorded repos pushed in the last 183 days, newest push first', () => {
    const picked = selectRepos([...userRepos, ...orgRepos], RECORDED_AT);
    expect(names(picked)).toEqual([
      'Dinnaga-Research/dinnaga',
      'weytani/living-graph',
      'weytani/d3-lwc-graphql',
      'weytani/d3-lwc-soql',
    ]);
  });

  it('maps a GitHub record to the contract fields', () => {
    const picked = selectRepos([...userRepos, ...orgRepos], RECORDED_AT);
    expect(picked[0]).toEqual({
      owner: 'Dinnaga-Research',
      name: 'dinnaga',
      url: 'https://github.com/Dinnaga-Research/dinnaga',
      description: 'Dinnaga Research — the dinnaga.ai homepage (React + Vite)',
      pushedAt: '2026-11-13T05:24:37Z',
      stars: 0,
    });
    expect(picked.find((r) => r.name === 'd3-lwc-soql')!.stars).toBe(1);
  });

  it('drops a fork, an archived repo, a repo pushed 200 days ago, a private repo, weytani/weytani and a .github repo', () => {
    const picked = selectRepos(
      [
        repo({ name: 'keeper', full_name: 'weytani/keeper' }),
        repo({ name: 'a-fork', full_name: 'weytani/a-fork', fork: true }),
        repo({ name: 'shelved', full_name: 'weytani/shelved', archived: true }),
        repo({ name: 'old', full_name: 'weytani/old', pushed_at: daysAgo(200) }),
        repo({ name: 'secret', full_name: 'weytani/secret', private: true }),
        repo({ name: 'weytani', full_name: 'weytani/weytani' }),
        repo({
          name: '.github',
          full_name: 'Dinnaga-Research/.github',
          owner: { login: 'Dinnaga-Research' },
        }),
      ],
      RECORDED_AT,
    );
    expect(names(picked)).toEqual(['weytani/keeper']);
  });

  it('keeps a repo pushed exactly 183 days ago and drops one a second older', () => {
    const picked = selectRepos(
      [
        repo({ name: 'edge', full_name: 'weytani/edge', pushed_at: daysAgo(183) }),
        repo({
          name: 'just-out',
          full_name: 'weytani/just-out',
          pushed_at: new Date(RECORDED_AT.getTime() - 183 * DAY - 1000).toISOString(),
        }),
      ],
      RECORDED_AT,
    );
    expect(names(picked)).toEqual(['weytani/edge']);
  });

  it('measures the window from the request time it is given', () => {
    const later = new Date(RECORDED_AT.getTime() + 100 * DAY);
    const picked = selectRepos([...userRepos, ...orgRepos], later);
    expect(names(picked)).toEqual(['Dinnaga-Research/dinnaga', 'weytani/living-graph']);
  });

  it('sorts across both listings by push, whatever order they arrive in', () => {
    const picked = selectRepos(
      [
        repo({ name: 'b', full_name: 'weytani/b', pushed_at: daysAgo(20) }),
        repo({ name: 'c', full_name: 'org/c', owner: { login: 'org' }, pushed_at: daysAgo(5) }),
        repo({ name: 'a', full_name: 'weytani/a', pushed_at: daysAgo(40) }),
      ],
      RECORDED_AT,
    );
    expect(names(picked)).toEqual(['org/c', 'weytani/b', 'weytani/a']);
  });

  it('reads a missing description as an empty string and ignores malformed entries', () => {
    const picked = selectRepos(
      [
        repo({ name: 'bare', full_name: 'weytani/bare', description: null }),
        null,
        'nope',
        { name: 'no-push', fork: false, archived: false, private: false },
        repo({ name: 'no-owner', full_name: 'weytani/no-owner', owner: null }),
      ],
      RECORDED_AT,
    );
    expect(picked).toHaveLength(1);
    expect(picked[0]!.description).toBe('');
  });
});

describe('selectGists', () => {
  it('maps a gist to its title, page URL and update time', () => {
    expect(selectGists(gists)).toEqual([
      {
        title:
          'GitHub Copilot + Playwright in VS Code: QA cheatsheet (settings, compaction, agents, safety rails)',
        url: 'https://gist.github.com/weytani/d049296faa7e3140909d8e3d8e14f829',
        updatedAt: '2026-10-18T05:07:13Z',
      },
    ]);
  });

  it('titles a gist with an empty description by its first file name', () => {
    const files = { 'notes.md': { filename: 'notes.md' }, 'z.txt': { filename: 'z.txt' } };
    const picked = selectGists([
      { ...gists[0], description: '', files },
      {
        ...gists[0],
        id: 'b',
        html_url: 'https://gist.github.com/weytani/b',
        description: null,
        files,
      },
      {
        ...gists[0],
        id: 'c',
        html_url: 'https://gist.github.com/weytani/c',
        description: '  \n ',
        files,
      },
    ]);
    expect(picked.map((g) => g.title)).toEqual(['notes.md', 'notes.md', 'notes.md']);
  });

  it('trims the description', () => {
    expect(selectGists([{ ...gists[0], description: '  Prework file \n' }])[0]!.title).toBe(
      'Prework file',
    );
  });

  it('drops secret gists and gists with neither a description nor a file', () => {
    const picked = selectGists([
      { ...gists[0], public: false },
      { ...gists[0], description: '', files: {} },
      { ...gists[0], description: 'Kept' },
    ]);
    expect(picked.map((g) => g.title)).toEqual(['Kept']);
  });

  it('sorts by updated_at newest first and keeps at most 20', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...gists[0],
      id: String(i),
      html_url: `https://gist.github.com/weytani/${i}`,
      description: `Gist ${i}`,
      updated_at: daysAgo(30 - i),
    }));
    const picked = selectGists([...many].reverse());
    expect(picked).toHaveLength(20);
    expect(picked[0]!.title).toBe('Gist 24');
    expect(picked[19]!.title).toBe('Gist 5');
  });
});

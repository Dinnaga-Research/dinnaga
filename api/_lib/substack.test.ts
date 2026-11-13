// @vitest-environment node
// ABOUTME: Tests the Substack source (#65): the feed URL, the newest five posts, failures that reject,
// ABOUTME: and that the GitHub token never travels to Substack.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixtureText } from '../__fixtures__/index.js';
import { fail, stubFetch, text } from '../__fixtures__/fetchStub.js';
import { loadPosts } from './substack.js';

const FEED = 'https://weytani.substack.com/feed';
const feed = fixtureText('substack-feed.xml');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// A feed with `n` posts, one a day, in the given order.
const feedOf = (n: number) =>
  `<rss version="2.0"><channel><title>HCI</title>` +
  Array.from({ length: n }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return (
      `<item><title>Post ${i + 1}</title><link>https://weytani.substack.com/p/post-${i + 1}</link>` +
      `<pubDate>Sun, ${day} Mar 2026 09:00:00 GMT</pubDate></item>`
    );
  }).join('') +
  `</channel></rss>`;

describe('loadPosts', () => {
  it('fetches the publication feed and returns the posts newest first', async () => {
    const { calls } = stubFetch({ [FEED]: text(feed) });
    const posts = await loadPosts();
    expect(calls.map((c) => c.url)).toEqual([FEED]);
    expect(posts.map((p) => p.title)).toEqual([
      'The coming storm',
      'The conversation has shifted',
      'Just the beginning...',
    ]);
  });

  it('keeps the newest five of a longer feed', async () => {
    stubFetch({ [FEED]: text(feedOf(8)) });
    const posts = await loadPosts();
    expect(posts.map((p) => p.title)).toEqual(['Post 8', 'Post 7', 'Post 6', 'Post 5', 'Post 4']);
  });

  it('returns an empty list, not a failure, for a feed with no posts', async () => {
    stubFetch({ [FEED]: text(feedOf(0)) });
    expect(await loadPosts()).toEqual([]);
  });

  it.each([
    ['a 503', text('down', 503)],
    ['a network error', fail()],
    ['an HTML page instead of a feed', text('<html><body>Just a moment...</body></html>')],
  ])('rejects on %s, so the source fails', async (_name, route) => {
    stubFetch({ [FEED]: route });
    await expect(loadPosts()).rejects.toThrow();
  });

  it('never sends the GitHub token to Substack', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'test-token-not-real');
    const { calls } = stubFetch({ [FEED]: text(feed) });
    await loadPosts();
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0]!.headers)).not.toContain('test-token-not-real');
    expect(calls[0]!.headers).not.toHaveProperty('authorization');
  });
});

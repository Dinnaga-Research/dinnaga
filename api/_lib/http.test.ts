// @vitest-environment node
// ABOUTME: Tests fetchText(): the 5-second timeout covers the connection and the body, and the reply
// ABOUTME: comes back as status plus text so callers can tell a 404 from a failure.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureText } from '../__fixtures__/index.js';
import { stubFetch, text } from '../__fixtures__/fetchStub.js';
import { fetchText, TIMEOUT_MS } from './http.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchText', () => {
  it('returns the status and body, and passes the headers and a signal to fetch', async () => {
    const { calls } = stubFetch({ 'https://x.test/a': text('hello', 201) });
    const reply = await fetchText('https://x.test/a', { 'X-One': '1' });
    expect(reply).toEqual({ status: 201, ok: true, body: 'hello' });
    expect(calls[0]!.headers['x-one']).toBe('1');
    expect(calls[0]!.signal).toBeInstanceOf(AbortSignal);
  });

  it('reports a non-2xx status without throwing', async () => {
    stubFetch({ 'https://x.test/a': text('nope', 404) });
    expect(await fetchText('https://x.test/a', {})).toEqual({
      status: 404,
      ok: false,
      body: 'nope',
    });
  });

  describe('timeout', () => {
    beforeEach(() => vi.useFakeTimers());

    // A request that never answers, but honours the abort signal like real fetch.
    const hang = () =>
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: string, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal!.addEventListener('abort', () =>
                reject(new DOMException('This operation was aborted', 'AbortError')),
              );
            }),
        ),
      );

    it('is five seconds', () => {
      expect(TIMEOUT_MS).toBe(5000);
    });

    it('gives up on a connection that never answers', async () => {
      hang();
      const pending = fetchText('https://x.test/slow', {});
      const outcome = pending.then(
        () => 'resolved',
        (e: Error) => e.message,
      );
      await vi.advanceTimersByTimeAsync(4999);
      let settled = false;
      void outcome.then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await outcome).toMatch(/timed out after 5000 ms/);
    });

    it('also gives up on a body that never finishes', async () => {
      const stalled = new Response(
        new ReadableStream({
          start() {
            /* never enqueues, never closes */
          },
        }),
      );
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => stalled),
      );
      const outcome = fetchText('https://x.test/stall', {}).then(
        () => 'resolved',
        (e: Error) => e.message,
      );
      await vi.advanceTimersByTimeAsync(5000);
      expect(await outcome).toMatch(/timed out/);
    });

    it('does not leave a timer behind after a fast answer', async () => {
      stubFetch({ 'https://x.test/a': text(fixtureText('substack-feed.xml')) });
      await fetchText('https://x.test/a', {});
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

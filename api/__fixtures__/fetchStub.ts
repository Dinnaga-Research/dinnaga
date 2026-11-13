// ABOUTME: A fetch stub for the api/ tests: routes by exact URL, records every call (URL and headers),
// ABOUTME: and fails loudly on a URL nobody routed, so a test can never reach the real network.
import { vi } from 'vitest';

type Reply = Response | Error;
export type Route = () => Reply | Promise<Reply>;

export interface Call {
  url: string;
  headers: Record<string, string>;
  signal: AbortSignal | null;
}

export const json =
  (body: unknown, status = 200): Route =>
  () =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const text =
  (body: string, status = 200): Route =>
  () =>
    new Response(body, { status });

export const fail =
  (message = 'fetch failed'): Route =>
  () =>
    new TypeError(message);

export function stubFetch(routes: Record<string, Route>): { calls: Call[] } {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      calls.push({
        url,
        headers: Object.fromEntries(new Headers(init?.headers).entries()),
        signal: init?.signal ?? null,
      });
      const route = routes[url];
      if (!route) throw new Error(`unrouted fetch in a test: ${url}`);
      const reply = await route();
      if (reply instanceof Error) throw reply;
      return reply;
    }),
  );
  return { calls };
}

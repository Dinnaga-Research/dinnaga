// @vitest-environment node
// ABOUTME: Tests the dev API plugin: it runs api/<name>.ts's GET normally, and with API_FIXTURES set
// ABOUTME: (the e2e server) it answers from <dir>/<name>/full.json and never runs a live handler.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ViteDevServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiDev } from './vite-api-dev';

type Middleware = (req: unknown, res: unknown, next: () => void) => Promise<void>;

function mount() {
  let middleware: Middleware | undefined;
  const ssrLoadModule = vi.fn(async () => ({
    GET: async () =>
      new Response('{"live":true}', { headers: { 'Content-Type': 'application/json' } }),
  }));
  const server = {
    middlewares: { use: (fn: Middleware) => (middleware = fn) },
    ssrLoadModule,
    config: { logger: { error: vi.fn() } },
  } as unknown as ViteDevServer;
  const plugin = apiDev();
  (plugin.configureServer as (s: ViteDevServer) => void)(server);
  return { middleware: middleware!, ssrLoadModule };
}

async function request(middleware: Middleware, url: string) {
  const headers: Record<string, string> = {};
  let body = '';
  const res = {
    statusCode: 200,
    setHeader: (k: string, v: string) => (headers[k.toLowerCase()] = v),
    end: (chunk?: Buffer | string) => (body = chunk ? chunk.toString() : ''),
  };
  const next = vi.fn();
  await middleware({ url, method: 'GET', headers: { host: 'localhost' } }, res, next);
  return { status: res.statusCode, headers, body, next };
}

afterEach(() => vi.unstubAllEnvs());

describe('apiDev', () => {
  it('runs the api/<name>.ts handler when API_FIXTURES is unset', async () => {
    vi.stubEnv('API_FIXTURES', '');
    const { middleware, ssrLoadModule } = mount();
    const res = await request(middleware, '/api/living');
    expect(ssrLoadModule).toHaveBeenCalledWith('/api/living.ts');
    expect(JSON.parse(res.body)).toEqual({ live: true });
  });

  it('with API_FIXTURES set, answers /api/living from the full fixture and never loads the handler', async () => {
    vi.stubEnv('API_FIXTURES', 'tests/fixtures');
    const { middleware, ssrLoadModule } = mount();
    const res = await request(middleware, '/api/living');
    const fixture = readFileSync(join(process.cwd(), 'tests/fixtures/living/full.json'), 'utf8');
    expect(ssrLoadModule).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');
    expect(JSON.parse(res.body)).toEqual(JSON.parse(fixture));
  });

  it('with API_FIXTURES set, an API without a fixture is a 404, not a live call', async () => {
    vi.stubEnv('API_FIXTURES', 'tests/fixtures');
    const { middleware, ssrLoadModule } = mount();
    const res = await request(middleware, '/api/no-such-api');
    expect(ssrLoadModule).not.toHaveBeenCalled();
    expect(res.status).toBe(404);
  });

  it('passes non-API requests on', async () => {
    const { middleware } = mount();
    const res = await request(middleware, '/atisha');
    expect(res.next).toHaveBeenCalled();
  });
});

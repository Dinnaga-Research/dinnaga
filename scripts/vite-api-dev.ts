// ABOUTME: Dev-only Vite plugin: serves /api/<name> from api/<name>.ts's exported GET handler,
// ABOUTME: loaded through the dev server (ssrLoadModule), so `bun run dev` answers like Vercel does.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

type Handler = (request: Request) => Promise<Response> | Response;

async function toRequest(req: IncomingMessage, origin: string): Promise<Request> {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(', '));
  }
  const method = req.method ?? 'GET';
  let body: ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const buf = Buffer.concat(chunks);
    body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  return new Request(new URL(req.url ?? '/', origin), { method, headers, body });
}

async function send(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export function apiDev(): Plugin {
  return {
    name: 'dinnaga-api-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const match = /^\/api\/([a-z0-9-]+)\/?(?:\?.*)?$/.exec(req.url ?? '');
        if (!match) return next();
        try {
          const mod = (await server.ssrLoadModule(`/api/${match[1]}.ts`)) as Record<string, unknown>;
          const handler = mod[req.method ?? 'GET'] as Handler | undefined;
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            res.end();
            return;
          }
          const origin = `http://${req.headers.host ?? 'localhost'}`;
          await send(res, await handler(await toRequest(req, origin)));
        } catch (err) {
          server.config.logger.error(`[api] /api/${match[1]}: ${String(err)}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'dev handler failed' }));
        }
      });
    },
  };
}

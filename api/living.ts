// ABOUTME: Vercel function GET /api/living (#65). STUB from the Darkroom foundation: every source
// ABOUTME: reports a failure until the real aggregator replaces this file.
import type { Living } from '../src/lib/living/contract';

export async function GET(): Promise<Response> {
  const body: Living = {
    generatedAt: new Date().toISOString(),
    repos: { ok: false, items: [] },
    gists: { ok: false, items: [] },
    posts: { ok: false, items: [] },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}

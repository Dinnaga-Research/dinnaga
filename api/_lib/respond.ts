// ABOUTME: Builds the api/living Response (#65): always 200 JSON, cached an hour at the CDN when every
// ABOUTME: source succeeded and five minutes when any failed, so a passing failure is not kept for an hour.
import type { Living } from '../../src/lib/living/contract';

const STALE = 'stale-while-revalidate=86400';
export const CACHE_ALL_OK = `public, s-maxage=3600, ${STALE}`;
export const CACHE_SOME_FAILED = `public, s-maxage=300, ${STALE}`;

export function livingResponse(body: Living): Response {
  const allOk = body.repos.ok && body.gists.ok && body.posts.ok;
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': allOk ? CACHE_ALL_OK : CACHE_SOME_FAILED,
    },
  });
}

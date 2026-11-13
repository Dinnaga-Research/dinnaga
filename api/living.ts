// ABOUTME: Vercel function GET /api/living (#65): the Living README's data. Aggregates GitHub (repos,
// ABOUTME: releases, gists) and the Substack feed server-side; each source fails alone as ok:false.
import type { Living, LivingSource } from '../src/lib/living/contract';
import { loadGists, loadRepos, redactToken } from './_lib/github.js';
import { livingResponse } from './_lib/respond.js';
import { loadPosts } from './_lib/substack.js';

/** Runs one source. A failure of any kind is `{ ok: false, items: [] }`; its reason is logged by name. */
async function settle<T>(name: string, load: () => Promise<T[]>): Promise<LivingSource<T>> {
  try {
    return { ok: true, items: await load() };
  } catch (err) {
    const reason = err instanceof Error ? redactToken(err.message) : 'unknown';
    console.error(`[api/living] ${name} failed: ${reason}`);
    return { ok: false, items: [] };
  }
}

export async function GET(): Promise<Response> {
  const now = new Date();
  const [repos, gists, posts] = await Promise.all([
    settle('repos', () => loadRepos(now)),
    settle('gists', loadGists),
    settle('posts', loadPosts),
  ]);
  const body: Living = { generatedAt: now.toISOString(), repos, gists, posts };
  return livingResponse(body);
}

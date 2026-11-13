// ABOUTME: The GitHub source (#65): the user's and the org's repos, each kept repo's latest release,
// ABOUTME: and the user's gists. GITHUB_TOKEN is optional, read from the environment, sent only to GitHub.
import type { LivingGist, LivingRepo } from '../../src/lib/living/contract';
import { selectGists, selectRepos } from './filter.js';
import { fetchText } from './http.js';

const API = 'https://api.github.com';
const USER = 'weytani';
const ORG = 'Dinnaga-Research';

function headers(): Record<string, string> {
  const base: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'dinnaga.ai-living',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}

/** GET a GitHub path expecting a JSON array; anything else (non-2xx, not JSON, not a list) throws. */
async function getList(path: string): Promise<unknown[]> {
  const reply = await fetchText(`${API}${path}`, headers());
  if (!reply.ok) throw new Error(`GitHub ${path} answered ${reply.status}`);
  const body: unknown = JSON.parse(reply.body);
  if (!Array.isArray(body)) throw new Error(`GitHub ${path} did not return a list`);
  return body;
}

/** The latest release's tag, or null when there is none (404) or the lookup fails for any reason. */
async function latestRelease(owner: string, name: string): Promise<string | null> {
  try {
    const reply = await fetchText(`${API}/repos/${owner}/${name}/releases/latest`, headers());
    if (!reply.ok) return null;
    const body: unknown = JSON.parse(reply.body);
    const tag =
      typeof body === 'object' && body !== null ? (body as { tag_name?: unknown }).tag_name : null;
    return typeof tag === 'string' && tag ? tag : null;
  } catch {
    return null;
  }
}

/** Repos worth listing, with their release marks. Rejects if either listing fails. */
export async function loadRepos(now: Date): Promise<LivingRepo[]> {
  const listings = await Promise.all([
    getList(`/users/${USER}/repos?type=owner&sort=pushed&per_page=100`),
    getList(`/orgs/${ORG}/repos?type=public&sort=pushed&per_page=100`),
  ]);
  const kept = selectRepos(listings.flat(), now);
  const releases = await Promise.all(kept.map((r) => latestRelease(r.owner, r.name)));
  return kept.map((repo, i) => ({ ...repo, release: releases[i] ?? null }));
}

/** Public gists, newest first, at most 20. Rejects if the listing fails. */
export async function loadGists(): Promise<LivingGist[]> {
  return selectGists(await getList(`/users/${USER}/gists?per_page=100`));
}

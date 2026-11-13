// ABOUTME: Picks what the Living README shows (#65): public, non-fork, non-archived repos pushed in the
// ABOUTME: last 183 days (minus profile repos), newest push first; and public gists, newest update first.
import type { LivingGist, LivingRepo } from '../../src/lib/living/contract';

export type RepoCandidate = Omit<LivingRepo, 'release'>;

export const WINDOW_DAYS = 183;
export const MAX_GISTS = 20;
const DAY_MS = 86_400_000;

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const text = (x: unknown): string | null => (typeof x === 'string' ? x : null);

function toRepo(x: unknown): { repo: RepoCandidate; time: number } | null {
  if (!isRec(x) || x.private !== false || x.fork !== false || x.archived !== false) return null;
  const owner = isRec(x.owner) ? text(x.owner.login) : null;
  const name = text(x.name);
  const url = text(x.html_url);
  const pushedAt = text(x.pushed_at);
  const time = pushedAt ? Date.parse(pushedAt) : Number.NaN;
  if (!owner || !name || !url || !pushedAt || Number.isNaN(time)) return null;
  const stars = typeof x.stargazers_count === 'number' ? x.stargazers_count : 0;
  const description = text(x.description) ?? '';
  return { repo: { owner, name, url, description, pushedAt, stars }, time };
}

// The profile repo (weytani/weytani) and any .github repo are infrastructure, not projects.
const isProfileRepo = (r: RepoCandidate) =>
  r.name.toLowerCase() === '.github' || `${r.owner}/${r.name}`.toLowerCase() === 'weytani/weytani';
const fullName = (r: RepoCandidate) => `${r.owner}/${r.name}`;

/** Repos worth listing, from the raw GitHub records of every listing, newest push first. */
export function selectRepos(raw: unknown[], now: Date): RepoCandidate[] {
  const since = now.getTime() - WINDOW_DAYS * DAY_MS;
  return raw
    .map(toRepo)
    .filter(
      (r): r is NonNullable<typeof r> => r !== null && r.time >= since && !isProfileRepo(r.repo),
    )
    .sort((a, b) => b.time - a.time || fullName(a.repo).localeCompare(fullName(b.repo)))
    .map((r) => r.repo);
}

function gistTitle(g: Rec): string | null {
  const description = text(g.description)?.trim();
  if (description) return description;
  const first = isRec(g.files) ? Object.entries(g.files)[0] : undefined;
  if (!first) return null;
  return (isRec(first[1]) ? text(first[1].filename) : null) ?? first[0];
}

/** Public gists, newest update first, at most `limit`. */
export function selectGists(raw: unknown[], limit = MAX_GISTS): LivingGist[] {
  const gists: { gist: LivingGist; time: number }[] = [];
  for (const g of raw) {
    if (!isRec(g) || g.public !== true) continue;
    const title = gistTitle(g);
    const url = text(g.html_url);
    const updatedAt = text(g.updated_at);
    const time = updatedAt ? Date.parse(updatedAt) : Number.NaN;
    if (!title || !url || !updatedAt || Number.isNaN(time)) continue;
    gists.push({ gist: { title, url, updatedAt }, time });
  }
  return gists
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
    .map((g) => g.gist);
}
